# Project Agent Instructions

## Context

Read these files before making implementation decisions:

- `docs/PROJECT_CONTEXT.md`
- `docs/MEMORY_ARCHITECTURE.md`
- `docs/PRD_MILESTONE_ESCROW_GUARDIAN.md`
- `CONTRIBUTOR_1_HANDOFF.md` when working on the Guardian memory/reasoning stream

## TypeScript Rules

These rules mirror `C:\Users\sysadmin\.ai-rules\rules\typescript.md` and apply to all TypeScript in this project:

- Use PascalCase for interfaces, types, classes, and components.
- Use camelCase for functions, variables, and methods.
- Use SCREAMING_SNAKE_CASE for constants.
- Use kebab-case for file names.
- Do not use `any` without an explicit justification comment.
- Do not use `@ts-ignore` or `@ts-expect-error` without an explanation.
- Prefer `unknown` when a value is genuinely unknown.
- Add explicit return types to exported functions.
- Group imports as external, internal, then relative.
- Prefer named exports and avoid circular dependencies.
- Handle promise rejections, use `try/catch` for fallible async operations, and never leave floating promises.

## Comment Rules

These rules mirror `C:\Users\sysadmin\.ai-rules\rules\comments.md`:

- Do not write comments that repeat what the code already says.
- Do not leave commented-out code in the repository.
- Do not use obvious comments such as `increment counter`.
- Prefer clear names and small functions over explanatory comments.
- Keep a comment only when it explains a non-obvious reason, invariant, safety boundary, or external constraint.

## Implementation Rules

- Contributor workstreams must remain independently runnable.
- Use the real Sibyl Memory client for memory work; do not replace it with a fake memory implementation.
- Keep the model provider replaceable until the team selects and integrates an LLM.
- Never let model output directly authorize escrow movement.
- Preserve user changes and do not commit unless explicitly requested.
