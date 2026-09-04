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
- Story 0 Task 3 complete: initialized git, created public repo `jamallwinn/autopoiesis`, deployed
  a placeholder page via GitHub Pages, confirmed reachable from off-device
  (https://jamallwinn.github.io/autopoiesis/). Full-history secret scan clean before publishing.
- **Story 0 is now fully complete and verified** — all 4 tasks, all 4 acceptance criteria, real
  evidence in `docs/stories/epic-1-story-0.md`. Flagged forward: Story 8 still needs a backend
  hosting decision (GitHub Pages is static-only); residency/judge-employment eligibility items
  need the human operator's own self-certification.
- **Story 1 complete and verified**: resolved the base-URL discrepancy by live test (both URLs
  work but return different model lists; `api.tokenfactory.nebius.com` declared canonical as the
  superset), added `NEBIUS_API_KEY` alias to `.env`, confirmed 6 real Nemotron model IDs (one more
  than previously known), and a real chat-completion smoke test succeeded. Updated
  `research/RESEARCH.md` §7.1 with all real findings. One non-blocking item flagged for manual
  follow-up: billing-credit confirmation isn't available via API.
- **Story 2 complete and verified**: scaffolded the `app/` Node/TypeScript project; confirmed
  native OpenAI-style tool-calling works against Nemotron (no fallback needed); implemented
  `runAgentTask()` with iteration cap, timeout, cancellation, and defined terminal states; 3/3 test
  prompts completed real multi-turn write→test→summarize cycles; deliberate iteration-cap test
  proved the cap actually stops a run. Failure-mode matrix: 6/6 passing, including a real bug found
  and fixed along the way — timeout errors were being silently misclassified as non-retryable
  because the openai SDK sets `err.constructor.name`, not an own `.name` property; caught by the
  story's own test, fixed in `app/src/retry.ts`, re-verified with no regression.
