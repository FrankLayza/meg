import { parseArgs } from "node:util";
import { BaseEscrowClient } from "../src/base-escrow.js";

const options = parseArgs({
  options: {
    milestone: { type: "string", short: "s" },
    amount: { type: "string", short: "a" },
    freelancer: { type: "string", short: "f" },
  },
});

const milestoneId = readString(options.values.milestone);
const amount = readString(options.values.amount);
const freelancer = readString(options.values.freelancer);

if (!milestoneId || !amount || !freelancer) {
  throw new Error("Usage: tsx scripts/fund-escrow.ts --milestone <id> --amount <wei> --freelancer <address>");
}

const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org";
const privateKey = process.env.GUARDIAN_PRIVATE_KEY;
const contractAddress = process.env.ESCROW_CONTRACT_ADDRESS;
if (!privateKey || !contractAddress) {
  throw new Error("GUARDIAN_PRIVATE_KEY and ESCROW_CONTRACT_ADDRESS are required.");
}

const client = new BaseEscrowClient({ rpcUrl, privateKey, contractAddress });
const value = BigInt(amount);

console.log(`Funding milestone ${milestoneId} with ${value} wei...`);
const funded = await client.fund(milestoneId, value);
console.log(`Funded. tx=${funded.transactionHash} status=${funded.receiptStatus}`);

console.log(`Setting freelancer ${freelancer} for milestone ${milestoneId}...`);
const prepared = await client.setFreelancer(milestoneId, freelancer as `0x${string}`);
console.log(`Freelancer set. tx=${prepared.transactionHash} status=${prepared.receiptStatus}`);

function readString(value: string | boolean | undefined): string {
  if (typeof value === "string") {
    return value;
  }
  return "";
}