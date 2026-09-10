# Milestone-Escrow Guardian - Hackathon Demo Runner (Windows)
param(
    [switch]$Revision,
    [switch]$Web
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " MILESTONE-ESCROW GUARDIAN • SIBYL LABS HACKATHON DEMO" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

if ($Web) {
    Write-Host "Starting Web Dashboard server on http://localhost:3000 ..." -ForegroundColor Yellow
    pnpm --filter milestone-guardian-demo run serve
    exit 0
}

if ($Revision) {
    Write-Host "Executing Live Pipeline: Scenario 1 (Revision Path)..." -ForegroundColor Yellow
    pnpm --filter milestone-guardian-demo exec tsx ../../integration/orchestrator.ts --revision
} else {
    Write-Host "Executing Live Pipeline: Scenario 2 (Approval & Release Path)..." -ForegroundColor Green
    pnpm --filter milestone-guardian-demo exec tsx ../../integration/orchestrator.ts
}
