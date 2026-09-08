import type { EscrowOnchainSnapshot } from "./types.js";

export type EscrowClientErrorKind =
  | "chain_unavailable"
  | "read_failed"
  | "not_funded"
  | "already_released"
  | "dispute_open"
  | "simulation_failure"
  | "send_failure";

export class EscrowClientError extends Error {
  public readonly kind: EscrowClientErrorKind;

  public constructor(kind: EscrowClientErrorKind, message: string) {
    super(message);
    this.name = "EscrowClientError";
    this.kind = kind;
  }
}

export interface ReleaseReceipt {
  transactionHash: string;
  receiptStatus: string;
}

export interface EscrowClient {
  getEscrowState(milestoneId: string): Promise<EscrowOnchainSnapshot>;
  simulateRelease(milestoneId: string): Promise<void>;
  release(milestoneId: string): Promise<ReleaseReceipt>;
}

export interface ReadRetryOptions {
  retries?: number;
  backoffMs?: number;
}

export async function withReadRetries<T>(
  operation: () => Promise<T>,
  options?: ReadRetryOptions,
): Promise<T> {
  const retries = Math.max(0, options?.retries ?? 2);
  const backoffMs = Math.max(0, options?.backoffMs ?? 250);
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(backoffMs * 2 ** attempt);
      }
    }
  }
  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error(`Read operation failed: ${String(lastError)}`);
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export interface MockEscrowOptions {
  snapshot?: Partial<EscrowOnchainSnapshot>;
  failReads?: number;
  readError?: Error;
  failSimulation?: boolean;
  simulationError?: Error;
  failRelease?: boolean;
  releaseError?: Error;
}

export class MockEscrowClient implements EscrowClient {
  public readonly snapshot: EscrowOnchainSnapshot;
  private readonly failReads: number;
  private readsAttempted: number;
  private readonly readError?: Error;
  private readonly failSimulation: boolean;
  private readonly simulationError?: Error;
  private readonly failRelease: boolean;
  private readonly releaseError?: Error;
  public releaseCalls: number;

  public constructor(options?: MockEscrowOptions) {
    this.snapshot = {
      funded: true,
      released: false,
      disputeOpen: false,
      ...options?.snapshot,
    };
    this.failReads = options?.failReads ?? 0;
    this.readsAttempted = 0;
    this.readError = options?.readError;
    this.failSimulation = options?.failSimulation ?? false;
    this.simulationError = options?.simulationError;
    this.failRelease = options?.failRelease ?? false;
    this.releaseError = options?.releaseError;
    this.releaseCalls = 0;
  }

  public async getEscrowState(milestoneId: string): Promise<EscrowOnchainSnapshot> {
    this.readsAttempted += 1;
    if (this.failReads > 0 && this.readsAttempted <= this.failReads) {
      throw this.readError ?? new EscrowClientError("read_failed", `Mock read failure (attempt ${this.readsAttempted}).`);
    }
    return { ...this.snapshot };
  }

  public async simulateRelease(milestoneId: string): Promise<void> {
    const snapshot = this.snapshot;
    if (!snapshot.funded) {
      throw new EscrowClientError("not_funded", `Escrow for milestone ${milestoneId} is not funded.`);
    }
    if (snapshot.released) {
      throw new EscrowClientError("already_released", `Milestone ${milestoneId} has already been released.`);
    }
    if (snapshot.disputeOpen) {
      throw new EscrowClientError("dispute_open", `A dispute is open for milestone ${milestoneId}.`);
    }
    if (this.failSimulation) {
      throw this.simulationError ?? new EscrowClientError("simulation_failure", `Simulation rejected for milestone ${milestoneId}.`);
    }
  }

  public async release(milestoneId: string): Promise<ReleaseReceipt> {
    await this.simulateRelease(milestoneId);
    this.releaseCalls += 1;
    if (this.failRelease) {
      throw this.releaseError ?? new EscrowClientError("send_failure", "Mock send failure injected.");
    }
    return {
      transactionHash: `mock-${milestoneId}-${this.releaseCalls}`,
      receiptStatus: "confirmed",
    };
  }
}