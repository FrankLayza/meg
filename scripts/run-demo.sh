#!/usr/bin/env bash
# Milestone-Escrow Guardian - Hackathon Demo Runner (Unix/macOS)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "\n========================================================"
echo -e " MILESTONE-ESCROW GUARDIAN • SIBYL LABS HACKATHON DEMO"
echo -e "========================================================\n"

if [[ "${1:-}" == "--web" ]]; then
    echo "Starting Web Dashboard server on http://localhost:3000 ..."
    pnpm --filter milestone-guardian-demo run serve
    exit 0
fi

if [[ "${1:-}" == "--revision" ]]; then
    echo "Executing Live Pipeline: Scenario 1 (Revision Path)..."
    pnpm --filter milestone-guardian-demo exec tsx ../../integration/orchestrator.ts --revision
else
    echo "Executing Live Pipeline: Scenario 2 (Approval & Release Path)..."
    pnpm --filter milestone-guardian-demo exec tsx ../../integration/orchestrator.ts
fi
