# Changelog

All notable changes to the Autopoiesis build are logged here, newest first. Each entry links to
the story whose Verification section holds the actual proof.

## [Unreleased]

### 2026-09-03
- Started Story 0 (preflight: eligibility gate, shared contract, deployment target).
- Story 0 Task 1 complete: eligibility re-verified against the live Devpost rules page. No
  conflicts found for anything checkable; residency and employment/family-relation-to-judges
  flagged for the human operator to self-certify (not something I can verify). See
  `docs/stories/epic-1-story-0.md`.
- Story 0 Task 2 complete: added `docs/architecture/shared-contract.md` v0.1 — the single
  versioned contract (`ToolInvocation`, tool namespaces + dispatcher, `write_file`,
  `run_command`/`run_tests`, `SandboxAdapter`, `VerificationResult`, dashboard events, job
  correlation ID) that Stories 2, 3, 6, and 8 all implement against.
