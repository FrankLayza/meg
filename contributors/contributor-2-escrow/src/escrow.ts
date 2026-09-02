export interface EscrowClient {
  release(milestoneId: string): Promise<{ transactionHash: string; receiptStatus: string }>;
}

export class MockEscrowClient implements EscrowClient {
  public async release(milestoneId: string): Promise<{ transactionHash: string; receiptStatus: string }> {
    return { transactionHash: `mock-${milestoneId}`, receiptStatus: "confirmed" };
  }
}
