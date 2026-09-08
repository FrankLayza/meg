import { createPublicClient, createWalletClient, getAddress, http, keccak256, toHex } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import type { Address, Hash, WriteContractParameters } from "viem";
import { escrowAbi } from "./escrow-abi.gen.js";
import { EscrowClientError, withReadRetries } from "./escrow.js";
import type { EscrowClient, ReleaseReceipt } from "./escrow.js";
import type { EscrowOnchainSnapshot } from "./types.js";

export interface BaseEscrowConfig {
  rpcUrl: string;
  privateKey: string;
  contractAddress: string;
}

export interface AdminReceipt {
  transactionHash: string;
  receiptStatus: "success" | "reverted";
}

export function milestoneKey(milestoneId: string): Hash {
  return keccak256(toHex(milestoneId));
}

export class BaseEscrowClient implements EscrowClient {
  private readonly publicClient;
  private readonly walletClient;
  private readonly contractAddress: Address;
  private readonly account: ReturnType<typeof privateKeyToAccount>;

  public constructor(config: BaseEscrowConfig) {
    if (!config.rpcUrl || !config.privateKey || !config.contractAddress) {
      throw new Error("BaseEscrowConfig requires rpcUrl, privateKey, and contractAddress.");
    }
    this.contractAddress = getAddress(config.contractAddress);
    this.account = privateKeyToAccount(config.privateKey as Hash);
    this.publicClient = createPublicClient({ chain: baseSepolia, transport: http(config.rpcUrl) });
    this.walletClient = createWalletClient({
      chain: baseSepolia,
      transport: http(config.rpcUrl),
      account: this.account,
    });
  }

  public async getEscrowState(milestoneId: string): Promise<EscrowOnchainSnapshot> {
    return withReadRetries(
      async () => {
        const [, , pendingAmount, funded, released, disputeOpen] = await this.publicClient.readContract({
          address: this.contractAddress,
          abi: escrowAbi,
          functionName: "escrows",
          args: [milestoneKey(milestoneId)],
        });
        return { funded, released, disputeOpen, amount: pendingAmount };
      },
      { retries: 2, backoffMs: 300 },
    );
  }

  public async simulateRelease(milestoneId: string): Promise<void> {
    try {
      await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: escrowAbi,
        functionName: "release",
        args: [milestoneKey(milestoneId)],
        account: this.account.address,
      });
    } catch (error) {
      throw rethrow(error, "simulation_failure", "Release simulation failed");
    }
  }

  public async release(milestoneId: string): Promise<ReleaseReceipt> {
    const key = milestoneKey(milestoneId);
    const simulated = await this.publicClient.simulateContract({
      address: this.contractAddress,
      abi: escrowAbi,
      functionName: "release",
      args: [key],
      account: this.account.address,
    });

    const nonce = await this.publicClient.getTransactionCount({ address: this.account.address });
    let transactionHash: Hash;
    try {
      transactionHash = await this.walletClient.writeContract({
        ...simulated.request,
        nonce,
      });
    } catch (error) {
      throw rethrow(error, "send_failure", "Release transaction send failed");
    }

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: transactionHash });
    if (receipt.status !== "success") {
      throw new EscrowClientError(
        "send_failure",
        `Release transaction reverted on chain (status ${receipt.status}). Hash: ${transactionHash}`,
      );
    }
    return { transactionHash, receiptStatus: receipt.status };
  }

  public getSignerAddress(): Address {
    return this.account.address;
  }

  public async fund(milestoneId: string, value: bigint): Promise<AdminReceipt> {
    const simulated = await this.publicClient.simulateContract({
      address: this.contractAddress,
      abi: escrowAbi,
      functionName: "fund",
      args: [milestoneKey(milestoneId)],
      account: this.account.address,
      value,
    });
    return this.send(simulated, "fund");
  }

  public async setFreelancer(milestoneId: string, freelancer: Address): Promise<AdminReceipt> {
    const simulated = await this.publicClient.simulateContract({
      address: this.contractAddress,
      abi: escrowAbi,
      functionName: "setFreelancer",
      args: [milestoneKey(milestoneId), getAddress(freelancer)],
      account: this.account.address,
    });
    return this.send(simulated, "setFreelancer");
  }

  public async setDispute(milestoneId: string, open: boolean): Promise<AdminReceipt> {
    const simulated = await this.publicClient.simulateContract({
      address: this.contractAddress,
      abi: escrowAbi,
      functionName: "setDispute",
      args: [milestoneKey(milestoneId), open],
      account: this.account.address,
    });
    return this.send(simulated, "setDispute");
  }

  private async send(
    simulated: { request: WriteContractParameters },
    label: string,
  ): Promise<AdminReceipt> {
    const nonce = await this.publicClient.getTransactionCount({ address: this.account.address });
    let transactionHash: Hash;
    try {
      transactionHash = await this.walletClient.writeContract({
        ...simulated.request,
        nonce,
      });
    } catch (error) {
      throw rethrow(error, "send_failure", `${label} transaction send failed`);
    }
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: transactionHash });
    return { transactionHash, receiptStatus: receipt.status === "success" ? "success" : "reverted" };
  }
}

function rethrow(error: unknown, kind: "simulation_failure" | "send_failure", prefix: string): EscrowClientError {
  if (error instanceof EscrowClientError) {
    return error;
  }
  const detail = error instanceof Error ? error.message : String(error);
  return new EscrowClientError(kind, `${prefix}: ${detail}`);
}