# Contributor 2: Escrow and Safety

This folder owns deterministic policy checks and the escrow client boundary. It consumes Contributor 1's decision JSON but does not depend on Contributor 1's runtime or an LLM.

The included `MockEscrowClient` is only a blockchain test double. The production adapter will be added later for Base Sepolia.
