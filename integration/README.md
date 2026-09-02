# Integration Guide

The contributor packages are independent. Integration uses stable JSON files, not imports into private folders.

## Assembly Order

1. Run Contributor 1 against a review fixture. Save its validated decision JSON.
2. Pass that JSON and escrow state to Contributor 2. Save its policy result JSON and transaction metadata.
3. Give Contributor 3 the review fixture, decision JSON, and policy result JSON. Render the full story.

## File Boundaries

- Contributor 1 owns the `decision.schema.json` producer.
- Contributor 2 owns the `policy-result.schema.json` producer.
- Contributor 3 is a consumer of both schemas.
- Shared fixtures are examples only; each contributor may create local fixtures without changing another contributor's implementation.

## Later Live Wiring

The future LLM provider replaces Contributor 1's deterministic reasoning function. The model must return the decision contract; Sibyl retrieval and decision validation remain application-owned. Contributor 2's deterministic policy remains the only path to a Base transaction.
