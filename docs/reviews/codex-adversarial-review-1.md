# Codex Adversarial Review #1 — Autopoiesis Plan, Dashboard, ACP Integration

Run 2026-09-03 via the `codex:codex-rescue` runtime (OpenAI Codex CLI, ChatGPT-authenticated).
Read-only review — no files were modified by Codex. This is the raw report; the epic and story
files were subsequently updated by hand to address each item (see the "Codex review 2026-09-03"
notes scattered through `docs/epics/epic-1-autopoiesis.md` and `docs/stories/epic-1-story-*.md`).

Scope given to Codex: `PLAN.md`, `research/RESEARCH.md`, `docs/epics/epic-1-autopoiesis.md`, and
`docs/stories/epic-1-story-1.md` through `epic-1-story-9.md` (the pre-review 9-story plan, before
Story 0 existed).

---

## 1. General Plan/Epic/Story Adversarial Review

1. **The build is falsely serialized around work that can and should run in parallel.**
   Story 4 says it is "independent of Stories 1–3 (can be built in parallel)," but the epic
   sequences it afterward. Story 8 is "blocked on Story 7 completion," Story 9 on Story 8, even
   though deployment, README, licensing, video scripting, and compliance checks don't need a
   finished dashboard. A late Contree or ACP blocker could leave no time for the dashboard,
   deployment, video, or submission packaging.
   *Fix:* parallel tracks — Stories 1–3 (brain/execution), 4–5 (identity/token), early Story 8 UX
   shell + deployment spike, immediate Story 9 license/compliance scaffolding. Keep only Story 6
   dependent on 3+5, Story 7 on 6, final dashboard integration/video on 7.

2. **The plan never creates the required working demo URL.** `PLAN.md` §2 and `RESEARCH.md` §1
   list a "working demo URL" as mandatory, but Story 8 had no hosting, deployment, public
   accessibility, health-check, or judge-session task; Story 9 verified only repo/video/Devpost/
   secret-grep.
   *Fix:* add a deployment task/AC requiring public HTTPS URL, deployed backend/provider listener,
   clean-browser test, health endpoint, CORS config, anonymous judge flow tested off the dev
   machine.

3. **Story 9 misstated the confirmed video limit.** PLAN/RESEARCH say "**<3 minute**"; Story 9
   repeatedly said "≤3 minutes" — a 3:00 video would satisfy the old Story 9 wording but violate
   the actual rule.
   *Fix:* change to "strictly under 3:00," target 2:40–2:50, verify published YouTube duration.

4. **Submission compliance deferred until after irreversible schedule decisions.** Team-size/
   geographic eligibility flagged unconfirmed in PLAN §2 but only re-checked at final submission
   (old Story 9 Task 6).
   *Fix:* add a preflight gate for eligibility, team limits, allowed prior work, judging access,
   submission ownership, required form fields — before implementation, repeated at final
   submission.

5. **Testnet is treated as eliminating all risk.** Epic claims "All financial risk is eliminated" /
   "fully repeatable," but Story 5 itself notes "one token per agent per chain, ever" — a botched
   launch invalidates all stored IDs/links/screenshots/reputation.
   *Fix:* testnet recovery plan — environment manifests for agent ID/wallet/token/offering/chain,
   replaceable config, re-pointing procedure, pre-funded verified backup identity.

6. **Signer custody is underspecified.** Story 4 stores `signerPrivateKey` in "local gitignored
   secrets" with `--policy restricted`; no definition of that policy, runtime secret store, file
   perms, rotation/revocation, backup, or dev/demo credential separation.
   *Fix:* dedicated secrets/custody task — policy permissions, encrypted deployment secrets, least
   privilege, no secrets in CLI args, log redaction, key-file perms, separate dev/demo signers,
   rotation test, revoke/replace procedure.

7. **Secret verification via plain grep is unsafe/incomplete.** Misses git history, generated
   bundles, screenshots/video, CI artifacts, terminal transcripts, encoded/truncated credentials.
   *Fix:* history-aware secret scanner across all refs, artifact/source-map inspection, screenshot/
   video review, rotation gate for any leaked credential.

8. **No real threat model for user-submitted code execution.** Story 3 mentioned "strict resource
   limits" only for local fallback; no network egress, filesystem isolation, dependency-install
   policy, process/CPU/memory/disk quotas, output caps, symlink/traversal protection, or cleanup
   between jobs defined.
   *Fix:* execution-security AC — ephemeral per-job sandboxes, no secrets inside sandbox,
   deny-by-default network, resource/output limits, path normalization, teardown, adversarial
   tests (timeout, fork bomb, secret probing, oversized output).

9. **Dashboard/ACP boundary has no auth, rate limiting, or output sanitization.** Public judge URL
   could be spammed into creating funded jobs, exhausting credits, or rendering model-produced
   HTML/script unsafely; no job-ownership isolation between viewers.
   *Fix:* server-side validation/length limits, per-session job ownership, rate/concurrency limits,
   no auto-spend from arbitrary requests, HTML-safe log rendering, tests for injection/replay/
   cross-session access.

10. **Acceptance criteria confuse "it happened once" with operational fitness.** No repeatability,
    latency, concurrency, or failure-recovery requirement anywhere in the original stories.
    *Fix:* small operational test matrix — 3 consecutive clean runs, measured time-to-first-event/
    total duration, injected inference failure, sandbox timeout, process restart, no double-charge/
    stranded jobs.

11. **"Self-funding agent" claim isn't actually demonstrated.** PLAN §6 claims fees "fund more/
    better compute," but stories only prove testnet USDC reaches a wallet — no measured compute
    cost, margin, or payment-to-Nebius mechanism.
    *Fix:* narrow claim to "on-chain revenue accounting prototype," or add a cost ledger with an
    explicitly labeled future treasury step.

12. **Reputation claim exceeds documented knowledge.** RESEARCH §7 says ERC-8004 mechanics (score,
    computation, reader) are "not documented," yet PLAN/Stories 5/7 assumed completed jobs update a
    "reputation record."
    *Fix:* pre-Story-6 exploration task defining the exact reputation field/event/trigger/query
    interface with before/after evidence; if job completion doesn't auto-update it, remove the
    claim or implement the update explicitly.

13. **Repro criterion improperly bundled account/secret creation.** Old Story 9 wanted README
    instructions for a "stranger" to reproduce Stories 1–8 including the Privy-managed signer and
    manual console steps — a stranger can't reproduce the same on-chain identity.
    *Fix:* split into public local setup / fresh independent testnet identity creation /
    maintainer-only deployment config, with safe placeholders.

## 2. Demo Dashboard Deep-Dive (Story 8)

1. **Three-panel layout is component-oriented, not journey-oriented.** Ignores the real journey:
   submission → ACP open/budget/funded → reasoning → sandbox iterations → submitted/completed →
   settlement/reputation/wallet update.
   *Fix:* one primary vertical job timeline — Request received → Payment secured → Agent planned →
   Sandbox running → Tests passed → Result delivered → Payment released. Task input above it,
   current result/next action in center, compact economy summary cards beside/below.

2. **Live ACP job state is missing despite being central to the pitch.** ACs never required
   `open`/`budget_set`/`funded`/`submitted`/`completed`/`rejected`/`expired` to be visible.
   *Fix:* "Agreement & payment" stepper driven by real ACP events — job ID, agreed fee,
   escrow-secured, deliverable submission, settlement confirmation, failure/expiry states.

3. **"Live reasoning" isn't actually required** — could show shell output with zero evidence of
   Nemotron planning/tool selection, weakening the mandatory NVIDIA-model story.
   *Fix:* sanitized agent-activity stream — "Nemotron created a 3-step plan," "requested
   write_file," "tests failed: 1," "revised implementation." Structured actions/summaries/model
   identity/latency, not raw chain-of-thought.

4. **Blockchain concepts shown in implementation language, not user language.** Raw wallet/RPC/
   explorer/gas/chain-ID language forces a non-crypto judge to learn crypto to follow the demo.
   *Fix:* plain labels by default — "Payment secured: 0.10 test USDC," "Agent earned: 0.095 test
   USDC," "Reputation: 1 verified completion," "AUTO token: test launch active." Chain/address/gas/
   explorer links behind a "Technical proof" disclosure; persistent "Demo funds — no real money"
   badge.

5. **Token panel has no defined purpose** — risks looking like crypto ornamentation.
   *Fix:* make token secondary. Small "Economic identity" section: token status, test price, curve
   progress, earned-fee balance, one sentence of explanation. Don't imply token price = reputation.

6. **Push vs. polling not decided per data type.**
   *Fix:* SSE/WebSocket push for job/reasoning/sandbox/ACP events with monotonic sequence numbers
   and reconnect replay; poll chain-derived balances slowly or refresh on tx confirmation, periodic
   reconciliation as fallback.

7. **No canonical cross-system job identity** — concurrent/retried runs could display one job's
   sandbox output beside another's ACP/wallet state.
   *Fix:* canonical application job ID mapped to ACP job/session ID, sandbox ID, model request IDs;
   every event/response carries it; dashboard subscribes only to the selected job.

8. **No failure/cancellation/timeout/retry UX.** Only the happy path was specified.
   *Fix:* explicit UI states/actions — retry connection, retry execution, cancel-before-funding,
   "job expired," "tests did not pass — nothing submitted," "settlement awaiting confirmation."

9. **No deliverable view.** Shows execution logs but not returned code/diff/test summary/artifact.
   *Fix:* "Deliverable" section — file tree/diff, code preview, test counts, download/copy action,
   exact artifact/version submitted to ACP.

10. **Story explicitly deprioritized visual polish** while Design is one of four equally weighted
    judging criteria — risks failing the "innovative and sleek" bar.
    *Fix:* compact design system + presentation criteria — deliberate typography/color, responsive
    layout, progressive disclosure, status hierarchy, empty/loading/error states, meaningful-only
    animation, timed usability test (new viewer explains the flow unaided).

11. **Dashboard work started too late to shape backend observability.**
    *Fix:* define the dashboard event contract *before* Stories 2/3/6 (typed events for model call,
    tool request/result, sandbox lifecycle, test summary, ACP state, tx confirmation, balance
    refresh); Story 8 remains final UI integration but its observability contract becomes an
    earlier dependency.

## 3. ACP Provider Integration Synergy (Story 6, and Stories 2/3/4/5)

1. **Story 6 conflated ACP's tools with the sandbox tools** — never stated whether ACP advertises
   the coding tools or how `executeTool()` routes to the sandbox adapter.
   *Fix:* two namespaces (ACP/session tools vs. coding/sandbox tools) + one dispatcher, with
   registration/schemas/authorization/result envelopes defined, and an integration test.

2. **Example parsed the wrong response shape for the chosen client** — said "swap the Anthropic
   example call" for Story 2's OpenAI client but still searched `response.content` for a
   `"tool_use"` block, which is Anthropic's shape, not OpenAI's — a valid tool call could go
   undetected, stalling the job after `"entry"`.
   *Fix:* explicit normalization adapter converting the real Nemotron/OpenAI response into a
   provider-neutral `ToolInvocation[]`; test with real fixtures, multiple calls, absent calls,
   malformed args.

3. **No complete multi-turn reasoning loop** — one model call → one tool block → execute, but
   Story 3's write→fail→fix→pass cycle needs repeated tool-result turns; the ACP path never fed
   test failure back to Nemotron.
   *Fix:* bounded loop — load messages, call model, execute all authorized tool calls, append
   normalized results, repeat until terminal deliverable or iteration/time/token limit, then
   transition ACP state.

4. **"Passing output" as the submission gate was undefined and unsafe** — model could write
   vacuous tests or fake exit 0.
   *Fix:* `VerificationResult` contract (command, exit code, timeout flag, discovered/passed/failed
   counts, artifact digest, policy violations). Submission requires exit 0, ≥1 discovered test,
   zero failures, no timeout/policy breach, matching artifact.

5. **Failure/timeout transitions unspecified** — `rejected`/`expired` exist in the protocol but
   were never implemented; escrow can remain locked with no terminal explanation.
   *Fix:* explicit transition table (pre-funding, post-funding, mid-execution, mid-submission,
   mid-settlement failures) — who can reject/expire, refund behavior, retry limits, escalation.

6. **No idempotency/duplicate-event protection** — reconnects/restarts could start two sandboxes,
   double-call `setBudget()`, or submit twice.
   *Fix:* durable per-job state keyed by ACP job/entry ID, idempotency keys, compare-and-set
   transition guards, replay tests for duplicate entries/reconnect/restart.

7. **On-chain funding confirmation not synchronized with execution** — no confirmation depth,
   stale-state, or reorg handling defined.
   *Fix:* funding-readiness predicate using session + tx receipt/confirmation policy; separate
   "funding observed" vs "funding confirmed" events; billable execution starts only after
   confirmation.

8. **Pricing/budget negotiation effectively hardcoded by omission** — a trivial task and a
   repo-scale task could get the same budget.
   *Fix:* quoting contract based on bounded task class, file/input limits, execution budget, max
   iterations; quoted scope + acceptance policy included before funding.

9. **Client-as-evaluator undermines the trust narrative** — self-approval by the paying script
   makes the reputation story circular.
   *Fix:* label honestly as a protocol-mechanics demo, or add a deterministic evaluator checking
   artifact + test attestation independent of the payer.

10. **Tokenization isn't operationally connected to ACP work** — token/ERC-8004 registration never
    affects pricing, submission, or settlement; the "economic body" is adjacent artifacts, not
    integrated.
    *Fix:* either drop Story 5 as a hard runtime dependency (call it identity enrichment), or
    define real linkage — same agent ID across offering/token/reputation, a verifiable job metric
    feeding the economic-identity view, revenue landing in the wallet tied to that exact tokenized
    agent.

## 4. Code Execution (Story 3) and Reasoning Loop (Story 2) Verification

1. **Story 2's tool-calling test was too weak** — a code block alone passed the AC, but a code
   block doesn't prove tool calling at all.
   *Fix:* separate acceptance modes (native tool-call round trip vs. versioned JSON fallback with
   strict validation), multiple prompts, recorded success rate.

2. **No actual agent loop** — only a single reasoning step existed; no termination, history
   management, tool-result insertion, max iterations, context limit, or final-answer contract.
   *Fix:* `runAgentTask()` with explicit states, message construction, tool-execution callback,
   tool-result correlation, max steps/tokens/time, cancellation, final deliverable schema, terminal
   error outcomes.

3. **Only auth/model failures were tested**, not rate limits, server errors, timeouts, malformed/
   truncated tool args, empty responses, refusals, or context overflow.
   *Fix:* retry classification with bounded exponential backoff, timeout/cancellation, retry-after
   handling, non-retryable validation errors, tests for injected 429/5xx/timeout/empty-response.

4. **Story 3's sandbox exploration task produced observations, not a durable contract** — said
   nothing about session lifecycle, file persistence, working directory, cancellation, artifact
   retrieval, concurrency, or cleanup.
   *Fix:* make it produce a versioned `SandboxAdapter` interface + conformance suite (create/run/
   write/read/collect/terminate, session identity, workspace semantics, result types, supported
   images, limits, cleanup, recorded implementation/version).

5. **`write_file` had no safe/portable schema** — model arguments could traverse outside the
   workspace.
   *Fix:* `write_file({relativePath, content, encoding, expectedPreviousHash?})`, reject absolute
   paths/traversal, cap size/count, normalize paths, prevent symlink escapes, return `{path,
   bytesWritten, sha256}` or typed error.

6. **`run_tests` had no stable execution/result schema** — Story 3 alternated between `run_tests`/
   `run_code`; exit code alone can't distinguish timeout vs. platform failure vs. no tests found.
   *Fix:* canonical `run_command({argv, cwd, timeoutMs, envAllowlist})` → `{status, exitCode,
   signal, timedOut, stdout, stderr, durationMs, truncated}`; `run_tests` adds parsed test counts +
   artifact hash; typed error codes.

7. **Streaming vs. batch semantics not reconciled** — long commands could appear hung with no
   progress display.
   *Fix:* separate event stream (ordered stdout/stderr chunks, sequence numbers, timestamps) from
   one immutable terminal result for the reasoning loop.

8. **Timeout semantics missing at every layer** — one hung command could eat the whole demo.
   *Fix:* nested deadlines (model request, sandbox provisioning, individual command, whole task,
   ACP job) with one propagated cancellation signal, sandbox process termination, and mapping to
   ACP failure policy + dashboard state.

9. **The local-fallback path undermined the mandatory sandbox story** — no submission threshold
   defined if Contree never works.
   *Fix:* treat local execution as dev-only, not equivalent completion. Require at least one real
   Contree end-to-end run for story/epic completion, or formally reassess and disclose the
   limitation.

10. **Test quality/task boundaries undefined** — risks a cherry-picked easy transcript that isn't
    reproducible.
    *Fix:* fixed verification corpus (deterministic repo fixture, requester + hidden harness tests,
    expected outcomes, allowed deps) reused across Stories 3, 6, 7, 8.

11. **No compatibility test spans Story 2 → Story 3 → Story 6** — each component's own tests could
    pass while the integrated schemas disagree.
    *Fix:* contract test with captured real Nemotron tool output + real/mocked ACP session
    verifying end-to-end schema compatibility (success, command failure, timeout, malformed args,
    multiple calls, streamed output).

## Top 5 Highest-Priority Fixes (as ranked by Codex)

1. Define the complete ACP failure/idempotency state machine.
2. Create one versioned contract spanning Nemotron → tool dispatch → Contree → ACP → dashboard
   events.
3. Move deployment and dashboard observability design earlier.
4. Add a real sandbox security/resource-isolation spec.
5. Correct and front-load submission compliance (`<3-minute` wording, missing deployment AC, late
   eligibility check).
