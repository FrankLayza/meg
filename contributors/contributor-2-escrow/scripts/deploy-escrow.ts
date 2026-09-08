import { createPublicClient, createWalletClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org";
const privateKey = process.env.GUARDIAN_PRIVATE_KEY ?? process.env.DEPLOYER_PRIVATE_KEY;
if (!privateKey) {
  throw new Error("GUARDIAN_PRIVATE_KEY is required to deploy MilestoneEscrow.");
}

const artifact = JSON.parse(
  await readFile(resolve(PACKAGE_ROOT, "dist", "contracts", "MilestoneEscrow.json"), "utf8"),
) as { abi: unknown[]; bytecode: string };

const account = privateKeyToAccount(privateKey as `0x${string}`);
const publicClient = createPublicClient({ chain: baseSepolia, transport: http(rpcUrl) });
const walletClient = createWalletClient({ chain: baseSepolia, transport: http(rpcUrl), account });

console.log(`Deploying MilestoneEscrow from ${account.address} on Base Sepolia...`);
const deployment = await walletClient.deployContract({
  abi: artifact.abi,
  bytecode: artifact.bytecode as `0x${string}`,
  args: [account.address],
});

const receipt = await publicClient.waitForTransactionReceipt({ hash: deployment });
if (receipt.status !== "success" || !receipt.contractAddress) {
  throw new Error(`Deployment failed (status ${receipt.status}).`);
}

console.log(`Deployed MilestoneEscrow: ${receipt.contractAddress}`);
console.log(`Deployment tx: ${deployment}`);
console.log(`Explorer: https://sepolia.basescan.org/address/${receipt.contractAddress}`);
console.log("Set ESCROW_CONTRACT_ADDRESS and ESCROW_ALLOWLIST in .env to this address.");