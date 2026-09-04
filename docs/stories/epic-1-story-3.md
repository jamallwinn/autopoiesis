# Story: Code Execution via Token Factory Sandboxes (Contree)

<!-- Source: B_Create_Story.md task -->
<!-- Context: Epic 1 (Autopoiesis), Story 3 of 10 (Track A) — depends on Story 0's contract and Story 2's loop -->
<!-- Revised 2026-09-03 after Codex adversarial review, docs/reviews/codex-adversarial-review-1.md §1.8, §4.4-4.10 -->

## Status: Draft — [ ] Not started (blocked on Story 0 and Story 2)

## Story

As the engineer building Autopoiesis,
I want a versioned `SandboxAdapter` implementation (per Story 0's contract) that gives the Story 2
reasoning loop real, security-isolated code execution in a Contree sandbox — with explicit
timeout, streaming, and cleanup semantics — backed by at least one genuine Contree run (not just a
local fallback),
so that Autopoiesis can actually write code, run it, see real pass/fail output, and iterate,
without that execution being an unbounded, unisolated security hole or an untested assumption.

## Context Source

- Source documents: `docs/architecture/shared-contract.md` (Story 0 — `SandboxAdapter`,
  `write_file`, `run_command`/`run_tests`, `VerificationResult` schemas), `research/RESEARCH.md`
  §7.1 (Contree — Beta, CLI/MCP surface only), `docs/reviews/codex-adversarial-review-1.md` §1.8,
  §4.4–§4.10
- Enhancement type: new component, integrates with Story 2's tool schema
- Existing system impact: Story 2's `write_file`/`run_command` tool stubs get real implementations;
  Story 2's reasoning-only behavior must still work if this story's sandbox call fails (graceful
  degradation, not a hard crash)

## Acceptance Criteria

1. **(Revised — was just an ad hoc exploration note)** Task 1's exploration produces a **versioned
   `SandboxAdapter` interface** (per Story 0's contract) with real, tested implementations of
   `create`/`run`/`write`/`read`/`collect`/`terminate`, real session-identity semantics, real
   working-directory/file-persistence behavior across calls in the same session, and a real
   cleanup/teardown call — not just one `echo hello` invocation.
2. `write_file` implements Story 0's exact schema (`{relativePath, content, encoding,
   expectedPreviousHash?}` → `{path, bytesWritten, sha256}` or a typed error), with real tests for:
   absolute-path rejection, path-traversal rejection (`../`), a size cap, and a file-count cap.
3. `run_command`/`run_tests` implements Story 0's exact schema (`{argv, cwd, timeoutMs,
   envAllowlist}` → `{status, exitCode, signal, timedOut, stdout, stderr, durationMs, truncated}`,
   with `run_tests` adding parsed discovered/passed/failed counts and an artifact digest) — exit
   code alone is never treated as sufficient to distinguish success from timeout from "no tests
   found."
4. **(New — security)** A real resource-isolation spec is implemented and tested: network egress
   denied by default, per-job ephemeral sandbox (no state or secrets persisting across jobs),
   CPU/memory/disk/output-size limits enforced, and adversarial tests actually run: an intentional
   infinite loop (confirms the timeout kills it), an intentional oversized-output command (confirms
   truncation), and an intentional attempt to read outside the workspace or reach the network
   (confirms it's blocked).
5. **(New)** Nested timeout semantics are implemented: a sandbox-provisioning timeout, a
   per-command timeout, and a whole-task timeout, each independently tested and each producing a
   `timedOut: true` result rather than a hang.
6. **(New)** A fixed verification corpus (at least one deterministic coding-task fixture with a
   known-correct solution and a known-buggy first attempt) is used to demonstrate a real write →
   fail → fix → pass cycle — reused later by Stories 6, 7, and 8 rather than each inventing its own
   ad hoc example.
7. **(Clarified)** Local subprocess execution, if used as a fallback during development, is
   explicitly dev-only and does NOT count toward story/epic completion — at least one full
   real-Contree run of the full corpus (AC 6) is required, or the limitation must be formally
   disclosed in this story and in `PLAN.md`/README, not silently substituted.

## Dev Technical Guidance

### Existing System Context

Story 2 produced a working Nemotron reasoning loop with tool-call stubs for `write_file` and
`run_command`/`run_tests`, normalized through Story 0's `ToolInvocation` contract. This story
replaces those stubs with real, security-bounded sandbox calls.

### Integration Approach

Per `research/RESEARCH.md` §7.1, only the CLI/MCP surface is confirmed for Contree — no raw REST
endpoint path was found. Two options, in order of preference:
1. **Contree MCP server** — `claude mcp add --transport stdio contree -- $(which uvx) contree-mcp`
   gives a `contree_run`-style tool taking `{"command": "...", "image": "tag:python:3.11"}`.
2. **Contree CLI directly**, shelled out to from Node/TypeScript (`child_process`) if the MCP path
   doesn't fit.
Task 1 is an explicit exploration task to determine which is actually workable and to fully map
its real session/lifecycle behavior — not just confirm one command runs — before committing to the
`SandboxAdapter` implementation.

### Technical Constraints

- Confirmed default runtime: Python 3.11+ (`tag:python:3.11` image); arbitrary OCI images are
  supported for other languages if needed later.
- Beta status means instability is possible — capture actual observed behavior (latency, error
  modes) as real notes, not assumptions.
- Billing/pricing for Sandboxes usage was not confirmed in research — Task 6 checks whether usage
  is visibly metered/billed during testing.

### Missing Information

- No confirmed raw REST endpoint path or SDK method signature exists for Sandboxes — Task 1 is the
  resolution step, and its output must satisfy Story 0's `SandboxAdapter` contract or explicitly
  document where Contree's real capabilities diverge from that contract (in which case, amend
  `shared-contract.md`, don't silently under-implement it).
- Whether Contree enforces network egress restrictions itself, or whether this story must implement
  that restriction at the adapter/orchestration layer, is unconfirmed — Task 4's adversarial network
  test resolves this.

## Tasks / Subtasks

- [ ] Task 1 (exploration, do first): Map the real Contree interface and lifecycle
  - [ ] Attempt MCP install (`uv tool install contree-mcp` or `pip install contree-mcp`)
  - [ ] Run a session that creates a workspace, writes a file, runs a command reading that file,
        and terminates — proving file persistence within a session and cleanup on termination
  - [ ] Paste the exact real invocations and real response shapes into Verification below
  - [ ] Update `research/RESEARCH.md` §7.1 and `docs/architecture/shared-contract.md` with the
        real confirmed `SandboxAdapter` shape (or documented deviation)
- [ ] Task 2: Implement `write_file` and `run_command`/`run_tests` against Story 0's schemas
  - [ ] Implement both with the exact input/output shapes from AC 2 and AC 3
  - [ ] Implement and test the security rejections (absolute path, traversal, size cap, count cap)
- [ ] Task 3: Implement resource isolation and adversarial tests
  - [ ] Deny network egress by default; confirm with a real attempted outbound call
  - [ ] Enforce CPU/memory/disk/output-size limits; confirm with a real oversized-output test
  - [ ] Run the infinite-loop timeout test; confirm real `timedOut: true` result
- [ ] Task 4: Implement nested timeouts
  - [ ] Sandbox-provisioning timeout, per-command timeout, whole-task timeout — each tested
        independently with real induced conditions
- [ ] Task 5: Build and run the fixed verification corpus
  - [ ] Create at least one fixture with a known-buggy first attempt and a known-correct fix
  - [ ] Demonstrate a real write → fail → fix → pass cycle through the full adapter; capture real
        output at each step
- [ ] Task 6: Record Beta-status and billing observations
  - [ ] Note any instability, unexpected latency, or errors encountered
  - [ ] Check the Nebius billing console for Sandboxes-related charges/usage during testing

## Risk Assessment

### Implementation Risks

- **Primary Risk:** Sandboxes is Beta with no confirmed stable API and (per Codex review) no
  originally-defined security boundary — either the interface or the isolation guarantees could
  differ from what's assumed.
- **Mitigation:** Task 1's exploration and Task 3's adversarial security tests happen before any
  dependent story is started; if Contree can't provide real network/resource isolation itself, the
  adapter layer must enforce it, and that decision is documented, not assumed away.
- **Verification:** Real captured output from every adversarial test in Task 3, not documentation
  claims.

### Rollback Plan

- If Contree proves unworkable after a real attempt, a documented local-fallback (dev-only, per AC
  7) replaces it for iteration — but does not count as story completion on its own.

### Safety Checks

- [ ] Story 2's plain-reasoning behavior (no sandbox) still works if the sandbox call is disabled
- [ ] No secrets (Nebius key, signer key) reachable from inside a sandbox execution
- [ ] No secrets leaked into sandbox execution logs pasted into this file

## Success Criteria

1. A real Contree session's exact lifecycle (create → write → run → read → terminate) is captured
   with real output at each step.
2. `research/RESEARCH.md` §7.1's "not verified" flag on Sandboxes' interface is replaced with the
   real confirmed shape, and `shared-contract.md` reflects it (or documents the deviation).
3. Every adversarial security test (network egress, oversized output, infinite loop/timeout) has
   real captured pass/fail evidence.
4. The fixed verification corpus's write→fail→fix→pass cycle is captured with real output.
5. At least one full run happened against real Contree, not only local fallback — or the
   limitation is explicitly disclosed, not silently substituted.

## Verification (fill in when the work is actually done — do not pre-fill or fabricate)

```
$ <paste the actual command run>
<paste the actual output>
```

Status after verification: **[ ] Not yet verified**
