# Shared Contracts

These JSON schemas are the only required handoff boundary between contributor folders.

- `review-request.schema.json`: input to Contributor 1.
- `decision.schema.json`: output from Contributor 1 and input to Contributor 2.
- `policy-result.schema.json`: output from Contributor 2 and input to Contributor 3.

Keep field names stable. Contributors may add implementation-specific fields inside their own folders, but integration artifacts must continue to validate against these schemas.
