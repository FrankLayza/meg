# Sibyl Labs Hackathon Brief

**Research date:** 2026-09-02  
**Primary event site:** <https://hack.sibyllabs.org/>  
**Official rules:** <https://hack.sibyllabs.org/rules>  
**Official submission guide:** <https://hack.sibyllabs.org/submissions>

## Executive Summary

Sibyl Labs is running one memory-centric challenge: build an agent or app whose **persistent Sibyl Memory is load-bearing**. The project must recall state written earlier in a fresh session and use that recall to change what it knows, decides, or does. Base and Virtuals Protocol are optional partner stacks that can increase the final score when their integrations perform real work.

The site states a **$10,000 USDC prize pool across the top five**, plus Base-related partner perks. Registration was scheduled for Aug 16-31, 2026; the build window is Sep 1-10, 2026. As of the research date, registration has closed, but the build window is underway. All deadlines are UTC.

## What Sibyl Is

Sibyl Memory is described in the official docs as local-first, file-based agentic memory backed by SQLite and FTS5 search, with zero embeddings. It organizes memory into five tiers: HOT state, WARM entities, COLD journal, REFERENCE documents, and ARCHIVE. The SDK exposes operations including `set_state`/`get_state`, `set_entity`/`get_entity`, `write_event`/`read_events`, `set_reference`/`get_reference`, `archive_entity`, and `search_entities`.

The official product/docs pages describe durable recall across sessions, local data storage, no vectors/embeddings, and support for Claude Code, Cursor, Codex, Hermes, and generic MCP clients. Sibyl Labs reports #2 on LongMemEval at 95.6%; that is a vendor-published benchmark claim, not a hackathon requirement.

Sources: <https://docs.sibyllabs.org/>; <https://docs.sibyllabs.org/memory/concepts>; <https://sibyllabs.org/products>

## Challenge and Eligibility Gate

There is one challenge and one leaderboard. A project must pass a pass/fail gate before scoring:

- Sibyl Memory must be on the critical path. Removing the memory layer must make the core function fail or materially degrade.
- The demo must show cold-start recall in a fresh session, as one continuous unedited segment, with an on-screen timestamp or commit hash.
- The README must identify where memory is written and read; judges should be able to find those calls in under two minutes.
- A wrapper that writes to memory but never reads it back to affect behavior is disqualified. Decorative integrations and unused imports do not qualify.

The rules state that the gate is decided by a majority of the judging panel; a tie fails the gate.

Source: <https://hack.sibyllabs.org/rules>

## Scoring

Only gate-passing projects receive the 100-point rubric:

| Criterion | Weight | What judges assess |
|---|---:|---|
| Memory is load-bearing | 40 | Centrality and sophistication of memory; recall, coordination, and dynamic storage score strongly |
| Innovation & originality | 25 | Novel idea and real usefulness |
| Technical execution | 20 | Clean, robust implementation that survives a second run and scrutiny |
| Pitch & presentation | 15 | A clear 2-5 minute story with an unmistakable load-bearing moment |

An evidence-based product-market-fit bonus adds up to **+10**. Accepted evidence includes a named audience with a validated pain point, waitlist/design partners, real usage, or pilots, backed by a publicly verifiable artifact. A market-size slide or unsupported claim earns no bonus; fabricated evidence can disqualify a project even after payout.

Final score is `(rubric + PMF bonus) × partner multiplier`.

## Partner Multiplier

Verified partner stacks increase the score by +15% for the first stack and +10% for the second, capped at **x1.25**. Sibyl Memory is mandatory and never counts as a bonus stack. A partner stack must be exercised in the submitted demo and serve the product's actual function.

- **Base:** deployment is the eligibility floor. The bonus requires an executed onchain action shown in the demo, such as a wallet operation, x402 payment, B20 read, or contract interaction.
- **Virtuals Protocol:** qualifying examples include an ACP job, a registered/transacting agent, or another Virtuals-native integration exercised in the demo.

Source: <https://hack.sibyllabs.org/rules>

## Timeline

- **Aug 16-31, 2026:** registration (closes Aug 31 at 23:59 UTC)
- **Sep 1-10, 2026:** build and submission window
- **Sep 5-7:** partner workshops with Base and Virtuals Protocol
- **Sep 11-12:** judging
- **Sep 13-15:** winners announced and spotlights published on X

Source: <https://hack.sibyllabs.org/rules>

## Prizes

| Place | Prize |
|---|---|
| 1 | $4,000 USDC on Base + Network School residency |
| 2 | $2,500 USDC on Base + one entry into a Base Support Program |
| 3 | $1,500 USDC on Base |
| 4 | $1,000 USDC on Base |
| 5 | $1,000 USDC on Base |

Prizes are paid in USDC on Base. Winners provide payout details; top-five teams participate in a short case-study interview. The Network School residency is non-transferable and passes to the next rank if a winner cannot accept it.

Source: <https://hack.sibyllabs.org/rules>

## Required Submission

Submission is made from the private build-page link issued at registration; there is no separate form. Add the materials to that page and mark it ready by **Sep 10, 23:59 UTC**.

Required items:

1. A public GitHub repository under an OSI-approved **MIT or Apache-2.0** license, with real commit history and complete setup/run instructions.
2. A **2-5 minute demo video** covering the problem/audience, product, operation, Sibyl Memory usage, and a fresh-session recall moment.
3. Team members and every Base or Virtuals stack used.
4. A README explaining what is persisted, recalled, and used for decisions; where memory is load-bearing; partner-stack locations; a short “how memory made this possible” note; and a Prior Work declaration.
5. Two public posts: the demo video and at least one build log, tagging `@sibylcap` and each claimed partner.

Source: <https://hack.sibyllabs.org/submissions>; <https://hack.sibyllabs.org/rules>

## Technical Setup and Interfaces

Official docs require **Python 3.10+**. The main install is:

```bash
pip install 'sibyl-memory-cli[mcp]'
sibyl init
sibyl setup
```

The CLI package brings the local SDK, Hermes provider, and MCP server. `sibyl setup` auto-detects Hermes, Claude Code, and Codex; the MCP server can also be pointed at any MCP-compatible client, including Cursor and Continue. The documented MCP tools are search, recall, and list over the local store.

For a custom Python orchestration, the docs show:

```python
from sibyl_memory_client import MemoryClient
memory = MemoryClient.local("~/.sibyl-memory/memory.db")
memory.set_entity("project", "atlas", {"status": "active"})
memory.get_entity("project", "atlas")
memory.write_event(acted=["deployed atlas v1.2 to staging"])
memory.search_entities("atlas")
```

The free tier provides the full five-tier system with a documented **2 MB local cap**; paid/staker tiers lift the cap and add features. The docs state credentials are written to `~/.sibyl-memory/credentials.json` with mode 0600. Memory is tenant-scoped and entity uniqueness is enforced by a database constraint.

Sources: <https://docs.sibyllabs.org/memory/install>; <https://docs.sibyllabs.org/memory/integrations>; <https://docs.sibyllabs.org/memory/concepts>; <https://docs.sibyllabs.org/memory/cli>

## Terms and Unknowns

- Entrants must be 18 or older and outside sanctioned jurisdictions. Sibyl Labs staff and reference builds are showcase-only and cannot win prizes.
- Entrants retain their IP; submission grants Sibyl Labs and named partners a non-exclusive, royalty-free license to feature submitted materials with attribution.
- The official pages do not publish a detailed judge roster, a separate category/track list, or an explicit team-size limit. Treat these as unknown unless the organizers clarify them.
- Registration status and dates above are the site's stated 2026 schedule; confirm any extension or late-entry policy with the organizers/Discord before relying on it.

Sources: <https://hack.sibyllabs.org/rules>; official Discord linked from the event site: <https://discord.gg/csya975jMa>
