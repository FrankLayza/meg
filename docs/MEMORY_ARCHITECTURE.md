# Sibyl Memory Architecture

## Official Integration Options

### Direct Python SDK

The official docs show:

```python
from sibyl_memory_client import MemoryClient

memory = MemoryClient.local("~/.sibyl-memory/memory.db")
```

This is the preferred path for Contributor 1 because it exposes the documented read/write API directly.

### MCP

The official `sibyl-memory-mcp` server uses stdio and can be called by any MCP-compatible client, including TypeScript applications using the MCP TypeScript SDK. The docs describe the MCP-facing tools as `search`, `recall`, and `list`.

MCP is useful when an LLM host should call Sibyl as a tool. It is less convenient for the Guardian's application-owned writes because the official integration page documents the direct write API in Python, not a TypeScript SDK.

## Five Tiers

| Tier | Sibyl API | Guardian data |
|---|---|---|
| HOT | `set_state` / `get_state` | Active milestone review and current submission state |
| WARM | `set_entity` / `get_entity` | Project, people, requirements, acceptance criteria |
| COLD | `write_event` / `read_events` | Feedback, revisions, prior reviews, decisions |
| REFERENCE | `set_reference` / `get_reference` | Contract, specification, scope, acceptance document |
| ARCHIVE | `archive_entity` | Superseded requirements and completed milestone records |

Use `search_entities` when a review needs cross-tier text retrieval. Every record must include project and milestone identifiers in its body or key so retrieval stays scoped.

## Guardian Memory Flow

1. Write the project, milestone, requirements, and stakeholder expectations.
2. Write each feedback item and submission as a dated event or reference.
3. In a fresh session, retrieve the active project entity, current state, relevant references, and matching historical events.
4. Assemble a bounded review context for the model provider.
5. Save the resulting decision and cited record identifiers.

## Testing Requirement

Tests should use the real Sibyl client against an isolated local database path, not a fake memory class. The deletion test should run the same evaluation with retrieval disabled or memory records removed, then show the project-specific decision loses the earlier requirement.

## Sources

- https://docs.sibyllabs.org/memory/concepts
- https://docs.sibyllabs.org/memory/integrations
- https://docs.sibyllabs.org/memory/cli
