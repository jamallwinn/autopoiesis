# Story: ACP Provider Integration

<!-- Source: B_Create_Story.md task -->
<!-- Context: Epic 1 (Autopoiesis), Story 6 of 10 — merge point of Track A (Stories 2/3) and Track B (Stories 4/5) -->
<!-- Substantially reworked 2026-09-03 after Codex adversarial review, docs/reviews/codex-adversarial-review-1.md §3 (all 10 items) -->

## Status: Draft — [ ] Not started (blocked on Story 0, 3, and 5)

## Story

As the engineer building Autopoiesis,
I want Autopoiesis's coding-job offering listed on the ACP Service Registry and the Story 2/3
reasoning+execution loop wired into ACP's `JobSession` lifecycle as a Provider — with a correct
response-normalization path, a real multi-turn loop, an explicit submission gate, and explicit
failure/timeout/idempotency handling,
so that real clients (human or another agent) can hire it and pay for real work through on-chain
escrow, with the brain and the economic body actually integrated rather than sequentially bolted
together at a single, fragile point of contact.

## Context Source

- Source documents: `docs/architecture/shared-contract.md` (Story 0), `research/RESEARCH.md` §7.2
  (verified `JobSession` methods and event pattern), Story 2/3 (reasoning + execution loop), Story
  4/5 (identity + token), `docs/reviews/codex-adversarial-review-1.md` §3.1–§3.10 (this story was
  rewritten specifically because Codex found it was the single highest-risk point in the plan —
  see the review's Top-5 fix #1 and #2)
- Enhancement type: integration story — connects two previously independent components
- Existing system impact: Story 2/3's tool-calling loop must continue to work standalone; this
  story adds ACP as a new trigger path into that same loop, it does not replace the loop's
  internals

## Acceptance Criteria

1. **(Fixed — real bug found in the original draft, review §3.2)** The model-response handling
   uses Story 2's already-implemented normalizer (raw response → `ToolInvocation[]`) — this story
   never re-implements or duplicates that parsing, and specifically never assumes an
   Anthropic-shaped `response.content` array (the original draft's example did, incorrectly, for
   an OpenAI-compatible client).
2. **(New — namespace split, review §3.1)** Two distinct tool namespaces exist with one dispatcher
   between them: **ACP/session tools** (whatever `session.availableTools()` actually exposes at
   the protocol layer) and **coding/sandbox tools** (`write_file`, `run_command`/`run_tests` from
   Story 3). The dispatcher's routing is covered by an integration test proving each tool name
   resolves to the correct handler.
3. **(New — real loop, review §3.3)** A bounded multi-turn loop runs per job — not one model call
   and one tool execution — using Story 2's `runAgentTask()`: load messages → call model → execute
   all authorized tool calls → append normalized results → repeat until a terminal deliverable or
   the iteration/time/token limit is hit, THEN transition ACP state. A real test demonstrates at
   least one job where the first sandbox run fails and the model produces a fix on a later turn
   before submission (i.e., Story 3's write→fail→fix→pass cycle happening *through* the ACP path,
   not just in Story 3's isolated test).
4. **(New — explicit gate, review §3.4)** `submit()` is gated strictly on Story 0's
   `VerificationResult` contract: exit code 0, at least 1 discovered test, zero failures, no
   timeout, no policy violation, and the submitted artifact's digest matches what was actually
   verified. A job is never submitted on a bare "it didn't crash."
5. **(New — failure/timeout handling, review §3.5)** An explicit transition table is implemented
   covering: pre-funding abandonment, post-funding execution failure (sandbox timeout or repeated
   test failure past the iteration cap), and mid-submission/settlement failure — each mapped to a
   real `reject()`/expiry path with a stated refund/escalation behavior, not left to hang in
   escrow indefinitely.
6. **(New — idempotency, review §3.6)** Per-job state is durable and keyed by the ACP job/entry
   ID, with idempotency keys guarding `setBudget()`/`submit()`/sandbox-session creation against
   duplicate `"entry"` events (e.g., from a reconnect). A real test sends a duplicate entry event
   and confirms no double sandbox run and no double state transition occurs.
7. **(New — funding sync, review §3.7)** `funded` state handling distinguishes "funding observed"
   (transaction seen) from "funding confirmed" (transaction reached the confirmation depth this
   story defines) — billable sandbox execution starts only after confirmation, not on first sight
   of the transaction.
8. **(New — pricing, review §3.8)** A stated, bounded pricing/quoting rule exists — tied to a
   defined task-size/complexity class with file-count/input-size limits and a maximum iteration
   budget — rather than a fixed price applied uniformly regardless of task size, which would let a
   disproportionately large task drain compute for a fixed fee.
9. **(New — honest framing, review §3.9)** Because Story 7's Client acts as its own Evaluator (no
   separate Evaluator role staffed for the demo), this story's documentation and any pitch material
   explicitly label the demo's `complete()` call as **self-attested by the paying Client**, not as
   independent third-party evaluation — the reputation story is described accurately (a protocol-
   mechanics demonstration) rather than implying stronger trust guarantees than actually exist.
10. **(New — real linkage, review §3.10)** Story 5's token/ERC-8004 identity is operationally
    connected to this story, not merely a prerequisite in name: the exact same agent ID is used
    across the Service Registry offering, the token, and the ERC-8004 record, and at least one real
    job's completion is shown to be queryable through that identity (e.g., the completed job is
    visible via whatever ERC-8004 query interface Story 5 confirmed) — not just three unrelated
    artifacts that happen to share a name.
11. Autopoiesis's coding-job offering is visible on the ACP Service Registry (confirmed via the
    Agent Console or a query against it).
12. Every dashboard event type defined in Story 0's contract (model-call, tool-request/result,
    sandbox-lifecycle, test-summary, ACP-state-transition, tx-confirmation) is actually emitted by
    this story's code, carrying the canonical job correlation ID — Story 8 depends on this.
13. Story 2's and Story 3's standalone behavior (tested without ACP) still passes after this
    integration — regression check.

## Dev Technical Guidance

### Existing System Context

Story 2/3 produced a working Node/TypeScript reasoning+execution loop with a real normalizer and a
real `SandboxAdapter`. Story 4/5 produced a funded, tokenized agent identity with a confirmed
ERC-8004 query path. Story 0 defined the event/tool contracts. This story is the merge point — and
per Codex's review, the point most likely to hide a real bug if rushed.

### Integration Approach

1. Install `@virtuals-protocol/acp-node-v2` (peer deps `viem`, `@account-kit/infra`).
2. **Manual web step**: list the coding-job offering at app.virtuals.io/acp/new using the Story 4
   agent id, with the pricing rule from AC 8 reflected in the offering's stated terms.
3. Implement the `agent.on("entry", ...)` handler to:
   - Call Story 2's normalizer on the raw model response (never re-parse it here).
   - Dispatch each normalized `ToolInvocation` through the AC 2 namespace router.
   - Drive the AC 3 bounded loop until a terminal deliverable.
   - Gate `submit()` on the AC 4 `VerificationResult` check.
   - Emit every AC 12 dashboard event as it happens, tagged with the job correlation ID.
4. Implement the AC 5 transition table, AC 6 idempotency guards, and AC 7 funding-confirmation
   check as first-class code paths, not afterthoughts bolted on once the happy path works.

### Technical Constraints

- No official quickstart exists for exactly this pairing — treat the SDK's own `src/examples/llm/`
  directory as a pattern to adapt, not a ready-made starter, and expect undocumented behavior.
- Fee split on job completion is enforced on-chain: 95% to Provider with no Evaluator designated,
  90%/5%/5% (Provider/Evaluator/Protocol) if one is.

### Missing Information

- Whether a dry-run/local-test mode exists for `JobSession` without spending real (testnet) funds
  per test run — Task 7 checks the SDK docs/examples directly before assuming every iteration
  needs a fresh funded job.
- Exact confirmation-depth convention for Base Sepolia (how many blocks counts as "confirmed" for
  AC 7) — not found in prior research; decide a reasonable value (e.g., matching what Base's own
  guidance suggests for testnet) and document the choice and rationale in Task 6.

## Tasks / Subtasks

- [ ] Task 1: List the offering with the AC 8 pricing rule reflected
  - [ ] Visit app.virtuals.io/acp/new; list the offering under the Story 4 agent id
  - [ ] Paste confirmation the listing is visible
- [ ] Task 2: Implement the tool-namespace dispatcher (AC 2)
  - [ ] Wire ACP/session tools and coding/sandbox tools through one router
  - [ ] Integration test proving correct routing for each tool name
- [ ] Task 3: Implement the bounded multi-turn loop (AC 3) and submission gate (AC 4)
  - [ ] Wire Story 2's `runAgentTask()` into the `"entry"` handler
  - [ ] Gate `submit()` on the real `VerificationResult`
  - [ ] Demonstrate a real fail→fix→pass job through this exact path
- [ ] Task 4: Implement the failure/timeout transition table (AC 5)
  - [ ] Real tests for pre-funding abandonment, post-funding execution failure, and mid-submission
        failure, each producing the correct terminal ACP state
- [ ] Task 5: Implement idempotency guards (AC 6)
  - [ ] Real duplicate-entry-event test confirming no double execution
- [ ] Task 6: Implement funding-confirmation sync (AC 7)
  - [ ] Decide and document the confirmation-depth convention
  - [ ] Real test distinguishing "observed" vs. "confirmed" funding
- [ ] Task 7 (exploration): Check for a dry-run/test mode
  - [ ] Review the SDK's `src/examples/llm/` and test utilities; document what's found
- [ ] Task 8: Wire dashboard event emission (AC 12)
  - [ ] Emit every Story 0 event type with the job correlation ID at the right point in the flow
- [ ] Task 9: Regression check
  - [ ] Re-run Story 2's and Story 3's standalone tests; confirm they still pass unmodified
- [ ] Task 10: Document the honest evaluator framing (AC 9) and the identity linkage (AC 10)
  - [ ] Write the explicit self-attestation disclosure
  - [ ] Demonstrate the real cross-artifact identity linkage with captured evidence

## Risk Assessment

### Implementation Risks

- **Primary Risk:** This exact integration (tokenized Provider + external LLM, with real
  multi-turn tool use) has no official example — undocumented SDK behavior could surface at any of
  the 10 acceptance criteria above.
- **Mitigation:** Build and test incrementally in the task order above — namespace routing, then
  the loop, then the gate, then failure handling, then idempotency, then funding sync — confirming
  each with real output before layering the next on top, rather than attempting all of it at once
  and debugging a tangle.
- **Verification:** Real event logs, real state-transition confirmations, and real duplicate-event/
  failure-path test results, pasted as proof for every acceptance criterion.

### Rollback Plan

- If the full state-machine proves too complex to finish in one pass, a partial implementation
  (e.g., the happy path plus AC 5's failure table, deferring AC 6's idempotency to a follow-up) is
  an acceptable interim state — document exactly what's implemented vs. not in this file's
  Verification section, never claim full completion for a partial build.

### Safety Checks

- [ ] Story 2/3's standalone test paths still pass (Task 9)
- [ ] No job is submitted/completed against mainnet — confirm testnet context throughout
- [ ] No secrets appear in any pasted log/event output in this file

## Success Criteria

1. Real confirmation the offering is listed on the Service Registry, with the pricing rule stated.
2. A real multi-turn job — including at least one fail→fix→pass cycle — completes through the ACP
   path end to end, with real logged output at each loop turn.
3. Every one of the 13 acceptance criteria above has independent, pasted, real evidence — this
   story is not marked complete on the strength of "the happy path worked once."
4. Stories 2 and 3's standalone tests re-run and pass, confirmed in this story's Verification.

## Verification (fill in when the work is actually done — do not pre-fill or fabricate)

```
$ <paste the actual command run>
<paste the actual output>
```

Status after verification: **[ ] Not yet verified**
