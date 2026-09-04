# Story: Standalone Nemotron Reasoning Loop

<!-- Source: B_Create_Story.md task -->
<!-- Context: Epic 1 (Autopoiesis), Story 2 of 10 (Track A) — depends on Story 0's contract and Story 1's confirmed endpoint/model -->
<!-- Revised 2026-09-03 after Codex adversarial review, docs/reviews/codex-adversarial-review-1.md §4.1-4.3 -->

## Status: Draft — [ ] Not started (blocked on Story 0 and Story 1)

## Story

As the engineer building Autopoiesis,
I want a standalone, bounded agent loop (`runAgentTask()`) that takes a coding-task description
and drives a real multi-turn plan→tool-call→observe→repeat cycle against the confirmed Nemotron
model, producing tool calls normalized to Story 0's `ToolInvocation` contract, and handling a real
range of failure modes,
so that later stories (sandbox execution, ACP wiring) have a genuinely working, resilient brain to
plug in — not a single-shot call that happens to work once in a demo.

## Context Source

- Source documents: `docs/architecture/shared-contract.md` (Story 0), `docs/reviews/
  codex-adversarial-review-1.md` §4.1–4.3, Story 1's Verification output (real base URL + model id)
- Enhancement type: new component, greenfield
- Existing system impact: none yet; this story must not touch Contree/Sandboxes or any Virtuals/
  chain code — that separation is deliberate so failures are attributable to one layer at a time

## Acceptance Criteria

1. **(Revised — was too weak)** Tool-calling is proven with a real round trip, not just "a tool
   call or a code block." Two acceptance modes, whichever the model actually supports (Task 3
   determines which):
   - **Native mode:** a real request with a `tools` schema returns a response containing a valid
     tool-call id, name, and arguments that round-trip through Story 0's `ToolInvocation`
     normalizer.
   - **Fallback mode** (if native tool-calling isn't supported): a versioned, strictly-validated
     JSON-in-text-output schema, with a repair/retry limit if the model emits malformed JSON.
   Run at least 3 distinct coding-task prompts in whichever mode is chosen; record the real
   success rate, not just "it worked once."
2. **(New)** A real `runAgentTask()` loop exists — not a single `runReasoningStep()` call — with
   explicit: message-history construction, tool-execution callback wiring, tool-result
   re-insertion into history, a max-iteration cap, a max-wall-clock-time cap, cancellation support,
   and a defined terminal state (either a final deliverable or a typed terminal error, never a
   silent hang).
3. **(New — was previously only auth/model-id failures)** A broader failure-mode matrix is tested
   for real, not assumed: HTTP 429 (rate limit), HTTP 5xx, request timeout, malformed/truncated
   tool-call arguments from the model, an empty/refusal response, and context-length overflow.
   Retryable failures (429, 5xx, timeout) get bounded exponential backoff with a cap; non-retryable
   failures (auth, malformed args after the repair limit) surface a typed, catchable error — no
   silent hang, no infinite retry loop.
4. No sandbox execution and no Virtuals/chain code exists in this story's scope — verified by
   checking the diff/file list touched.
5. The language/runtime decision (Node/TypeScript, per the existing rationale below) is recorded.
6. Every `ToolInvocation` this loop produces is validated against Story 0's contract schema before
   being handed to a caller — this is the seam Story 6 depends on being trustworthy.

## Dev Technical Guidance

### Existing System Context

Story 1 produced a confirmed base URL, a confirmed `NEBIUS_API_KEY` env var, and at least one real
Nemotron model id string. Story 0 produced the `ToolInvocation`/tool-namespace contract this loop
must emit against. This story is the first to write the actual agent-loop application code.

### Integration Approach

**Decision point — language (unchanged from the original plan):** build in **Node.js/TypeScript**
using the `openai` npm package pointed at the Nebius `base_url`, so Story 6 (ACP SDK, JS/TS-only)
can import this loop directly rather than crossing a language boundary.

**Response normalization (Codex review §3.2 — this is the fix for a real bug found in the original
Story 6 draft):** whatever raw shape the Nebius/Nemotron OpenAI-compatible response actually
returns (Task 3 confirms whether it's standard OpenAI `tool_calls` array shape, since that was
assumed but not explicitly tested), write one explicit normalizer function that converts it into
Story 0's `ToolInvocation[]`. Story 6 must never inspect the raw provider response directly — only
ever consume the normalized array. This is what prevents a provider-shape mismatch from silently
breaking the ACP integration later.

### Technical Constraints

- Use the `openai` npm package's `OpenAI` client, `base_url` = the URL confirmed in Story 1,
  `apiKey` = `process.env.NEBIUS_API_KEY`.
- Tool schema for this story's own testing: stub signatures for `write_file` and
  `run_command`/`run_tests` matching Story 0's contract exactly (real implementations come in
  Story 3) — the loop's shape must already match what Story 3 will plug into.
- See `docs/architecture/shared-contract.md` for the exact `ToolInvocation` shape and the ACP-tool
  vs. coding-tool namespace split this loop must respect.

### Missing Information

- Whether Nemotron-3-Super-120B specifically supports native OpenAI-style tool-calling in the
  compatible API is not confirmed by prior research — Task 3 tests this directly; if unsupported,
  the fallback JSON mode (AC 1) is used and documented, not silently worked around.

## Tasks / Subtasks

- [ ] Task 1: Scaffold the Node/TypeScript project
  - [ ] `npm init`, install `openai`, `typescript`, `dotenv` (or equivalent env loader)
  - [ ] Confirm `.env` loading picks up `NEBIUS_API_KEY` from Story 1
- [ ] Task 2: Implement the response normalizer
  - [ ] Write the raw-response → `ToolInvocation[]` normalizer per Story 0's contract
  - [ ] Unit-test it against a real captured response (not a hand-written fixture) from Task 3
- [ ] Task 3: Verify tool-calling mode and implement `runAgentTask()`
  - [ ] Send a request with the Story 0 tool schema and a trivial coding prompt; determine native
        vs. fallback mode from the real response shape
  - [ ] Implement `runAgentTask()` with history/iteration-cap/timeout/cancellation per AC 2
  - [ ] Run at least 3 distinct prompts; record real success rate
- [ ] Task 4: Failure-mode matrix
  - [ ] Test rate-limit (429), server error (5xx), timeout, malformed tool args, empty/refusal
        response, and context overflow — each with real induced conditions (e.g., a deliberately
        oversized prompt for context overflow, a bad endpoint for timeout) where possible; where a
        condition can't be induced live (e.g., real 429 without abusing the API), document the
        retry/backoff code path and test it against a mocked response instead, and say so
        explicitly rather than claiming a live test that didn't happen
  - [ ] Confirm retryable vs. non-retryable classification behaves as specified; paste real output
- [ ] Task 5: Record the language decision and rationale in this file's Verification section

## Risk Assessment

### Implementation Risks

- **Primary Risk:** Nemotron-3-Super-120B (or whichever model Story 1 confirmed) may not support
  native OpenAI-style tool-calling, which would change the shape of everything downstream.
- **Mitigation:** Task 3 tests this directly and early. If unsupported, the fallback JSON mode is
  used and documented in both this file and `docs/architecture/shared-contract.md`.
- **Verification:** Actual API response bodies from Task 3, not a description of expected
  behavior.

### Rollback Plan

- N/A — new component. If the language/library choice proves wrong, the fix is switching library
  versions or the tool-calling approach within this same story before marking it complete.

### Safety Checks

- [ ] No sandbox or chain code introduced in this story (confirmed via file diff review)
- [ ] `.env` still gitignored (re-check, don't assume Story 1's check still holds)
- [ ] Every `ToolInvocation` produced is schema-validated before being returned to a caller

## Success Criteria

1. A real round-trip tool-call (native or documented fallback) is captured for at least 3 distinct
   coding-task prompts, with a real recorded success rate.
2. `runAgentTask()` exists with iteration cap, timeout, cancellation, and a defined terminal state
   — demonstrated with real captured runs, including at least one run that hits the iteration or
   timeout cap on purpose (to prove the cap actually stops it).
3. The failure-mode matrix (AC 3) is tested with real or explicitly-labeled-as-mocked evidence for
   each condition — no condition is silently skipped.
4. No files related to Contree/Sandboxes or Virtuals/ACP exist yet in the repo — scope discipline
   confirmed.
5. The response normalizer is unit-tested against a real captured API response, not a hand-written
   guess at the shape.

## Verification (fill in when the work is actually done — do not pre-fill or fabricate)

```
$ <paste the actual command run>
<paste the actual output>
```

Status after verification: **[ ] Not yet verified**
