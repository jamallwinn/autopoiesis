# Story: Demo Dashboard

<!-- Source: B_Create_Story.md task -->
<!-- Context: Epic 1 (Autopoiesis), Story 8 of 10 — the only piece a judge directly touches -->
<!-- Substantially reworked 2026-09-03 after Codex adversarial review, docs/reviews/codex-adversarial-review-1.md §2 (all 11 items) -->

## Status: Draft — [ ] Not started. Deployment shell can start after Story 0; full data wiring blocked on Story 7.

## Story

As a hackathon judge or demo viewer — including one with zero blockchain/crypto background,
I want a single, journey-oriented view that shows a coding task moving from request through
payment, live reasoning, sandboxed execution, and settlement, in plain language by default, with
technical/on-chain detail available but not required,
so that the project reads as a coherent, innovative, sleek product (the "Design" judging
criterion — one of four equally weighted criteria, not an afterthought) that anyone can follow
without first learning what a chain ID or gas fee is.

## Context Source

- Source documents: `docs/architecture/shared-contract.md` (Story 0 — dashboard event contract),
  `PLAN.md` §5 (layer 1, presentation), `docs/epics/epic-1-autopoiesis.md` (epic success criteria),
  `docs/reviews/codex-adversarial-review-1.md` §2.1–§2.11 (this story's layout, information
  architecture, and scope were substantially revised in response to this review)
- Enhancement type: new UI layer, deployed early as a shell (Story 0's proven deployment target),
  fully wired to real data after Story 7
- Existing system impact: none — this story must not change any behavior proven in Stories 1-7,
  only expose it visually, in real time, and in an approachable way

## Acceptance Criteria

1. **(Fixed — was component-oriented, review §2.1)** The layout's primary element is one vertical
   **job timeline**, not three side-by-side panels the viewer has to mentally correlate:
   **Request received → Payment secured → Agent planned → Sandbox running → Tests passed → Result
   delivered → Payment released.** Task input sits above it; the current step's detail and the
   next expected action sit in the center; a compact economic-identity summary sits alongside,
   secondary to the timeline.
2. **(New — was missing entirely, review §2.2)** An explicit **"Agreement & payment" stepper**,
   driven by real ACP job-state events (`open`/`budget_set`/`funded`/`submitted`/`completed`, and
   the failure states `rejected`/`expired`), is visible — job id, agreed fee, escrow-secured
   moment, deliverable-submission moment, settlement confirmation, and a clear failure/expiry state
   if one occurs. This is not optional polish — it's the direct visual evidence of the ACP
   mechanics the whole project's pitch depends on.
3. **(Strengthened — was permissive, review §2.3)** A **sanitized agent-activity stream** is
   required, not just "execution progress" — it must show evidence of Nemotron's actual reasoning
   and tool selection (e.g., "Nemotron created a 3-step plan," "requested write_file: solution.py,"
   "ran tests: 1 failed," "revised implementation," "ran tests: 3 passed"), with the model's
   identity and per-call latency visible. Raw chain-of-thought is not shown (safety/readability);
   structured action summaries are. A judge must be able to tell, from this stream alone, that
   NVIDIA's model is actually doing the reasoning — not just that "something ran."
4. **(New — was implementation language throughout, review §2.4)** Blockchain/wallet concepts are
   translated to plain language by default: "Payment secured: 0.10 test USDC," "Agent earned:
   0.095 test USDC," "Reputation: N verified completions," "AUTO token: test launch active." Raw
   addresses, chain IDs, gas, and RPC/explorer data are available but only behind an explicit
   **"Technical proof" disclosure** (collapsed by default). A persistent, unmissable **"Demo funds
   — no real money" badge** is shown at all times. A judge should never need to understand gas or
   chain IDs to follow what happened.
5. **(Scoped — was undefined, review §2.5)** The token/economic-identity panel is secondary to the
   job timeline, with a defined, minimal purpose: token status, test-network price, bonding-curve
   progress, and the agent's earned-fee balance, plus one plain sentence explaining what it means.
   It must not imply that token price equals reputation or quality — those are shown separately
   (AC 2's completion count / ERC-8004 query result).
6. **(New — undecided before, review §2.6)** Real-time job/reasoning/sandbox/ACP events are
   delivered via server-sent push (SSE or WebSocket) with monotonic per-job sequence numbers and
   reconnect-replay (a viewer who refreshes mid-job sees the full history, not a gap). Chain-derived
   balances (wallet/token) are refreshed on transaction confirmation and periodically reconciled,
   not tightly polled.
7. **(New — was absent, review §2.7)** Every event and every UI element for a given job carries
   the canonical job correlation ID from Story 0's contract. The dashboard subscribes only to the
   selected job's event stream — concurrent or retried jobs never bleed into each other's display.
8. **(New — happy path only before, review §2.8)** Explicit UI states exist for: connection lost
   (with a retry action), sandbox execution failed after the retry/iteration limit ("tests did not
   pass — nothing was submitted or charged"), funding rejected, job expired, and settlement
   awaiting confirmation — each with a clear, plain-language explanation, not a spinner that never
   resolves.
9. **(New — missing, review §2.9)** A **"Deliverable" section** shows what Autopoiesis actually
   produced: the changed file(s) or a diff, a code preview, the real test-pass count, and a way to
   view/copy the exact artifact that was submitted as the ACP job's deliverable.
10. **(Corrected — review §2.10)** Because "Design" is one of four *equally weighted* judging
    criteria (per `research/RESEARCH.md` §1), this dashboard is held to a real design-system
    standard, not deprioritized: deliberate typography and color (not defaults), a responsive
    layout, progressive disclosure (plain view first, technical detail on demand — AC 4),
    consistent status hierarchy across the timeline, meaningful-only motion (no decorative
    animation), and defined empty/loading/error states for every panel. A timed usability check
    (Task 6) — a person who has not seen this project before, given 60 seconds, correctly narrates
    what happened in a completed job — is part of this story's actual completion bar, not a nice-
    to-have.
11. **(New — deployment, ties to Story 0 and epic DoD)** The dashboard is deployed to the real
    public HTTPS URL Story 0 proved out, backed by the real Story 6/7 flow (not a mock), reachable
    and functional from a clean browser/incognito session on a device other than the dev machine,
    with basic abuse protection: server-side input length limits, per-viewer job ownership (one
    viewer can't see or cancel another's job), and a rate/concurrency limit on job creation so a
    public URL can't be spammed into creating unbounded funded jobs.

## Dev Technical Guidance

### Existing System Context

Story 0 proved the deployment path and defined the dashboard event contract. Stories 1-7 proved
the full backend loop works. This story is presentation, but presentation now has real acceptance
criteria of its own — it is not "just wire up what already works."

### Integration Approach

Minimal stack recommendation unchanged: a single-page app calling a small backend API that wraps
the Story 6/7 Node/TypeScript code directly, or via a thin HTTP/SSE layer. Consume Story 0's event
contract directly — do not invent a parallel event shape.

### Technical Constraints

- Every event rendered must carry and be filterable by the job correlation ID (AC 7).
- The "plain language by default, technical detail behind disclosure" split (AC 4) is a hard
  requirement, not a stretch goal — it's what makes the blockchain layer "intuitive and zero
  friction," per the explicit brief this story is responding to.

### Missing Information

- Which data source (`acp agent whoami` vs. a direct on-chain query) actually gives usable
  price/holder data for the bonding-curve token — Task 3 is an exploration task to resolve this,
  same as before, now feeding into the AC 5 economic panel specifically.
- **(New — Story 0's Task 3 finding)** Story 0 proved GitHub Pages as a working *static* deployment
  path, but static hosting alone cannot serve this story's backend (job-creation API, SSE event
  stream). Task 1 below must decide and deploy a real backend hosting target — a Nebius AI
  Cloud instance/DevPod is worth considering first since it would reinforce the mandatory
  Nebius-usage story — before AC 11's public-URL requirement can be met for the real dashboard, not
  just the placeholder page.

## Tasks / Subtasks

- [ ] Task 1: Build the job-timeline shell (AC 1) and deploy it to the real Story 0 URL early
  - [ ] Deployable even before Story 7 is done, using placeholder/mock events explicitly labeled
        as such internally — never shown to a real viewer as if live
- [ ] Task 2: Wire the real event stream (AC 6, AC 7)
  - [ ] SSE/WebSocket connection with sequence numbers and reconnect-replay
  - [ ] Confirm job-scoped subscription with a real concurrent-job test (two jobs at once, confirm
        no cross-contamination in the UI)
- [ ] Task 3 (exploration): Resolve the economic-panel data source; build the AC 5 panel
  - [ ] Determine and document which data source is usable
  - [ ] Build the minimal, secondary economic-identity panel
- [ ] Task 4: Build the ACP stepper (AC 2) and the agent-activity stream (AC 3)
  - [ ] Both driven by real events from Story 6, including failure states
- [ ] Task 5: Build the plain-language translation layer (AC 4) and the Deliverable section (AC 9)
  - [ ] Technical proof disclosure, demo-funds badge, deliverable diff/preview/download
- [ ] Task 6: Design pass and usability check (AC 10)
  - [ ] Apply a deliberate design system (typography, color, responsive layout, status hierarchy,
        empty/loading/error states)
  - [ ] Run the 60-second usability check with a real person unfamiliar with the project; record
        the real outcome (pass/fail and what was unclear)
- [ ] Task 7: Failure-state UX (AC 8) and abuse protection (AC 11)
  - [ ] Implement and test every listed failure state
  - [ ] Implement and test rate/concurrency limits and per-viewer job ownership
- [ ] Task 8: Full manual run-through and public verification
  - [ ] Execute one complete flow through the deployed public URL, from a device other than the
        dev machine
  - [ ] Capture a screen recording or timestamped screenshots as proof; reference the file path in
        Verification

## Risk Assessment

### Implementation Risks

- **Primary Risk:** Time pressure this late in the build sequence could tempt mocking the
  economic panel or the reasoning stream "just for the demo" — this would directly violate the
  epic's no-fabrication requirement and would be immediately visible to a judge who checks the
  Technical Proof disclosure against reality.
- **Mitigation:** Every acceptance criterion above requires real, live data and real captured
  evidence — no story is marked complete on a mocked panel, and Task 1's early-deployed shell must
  never be shown to a real viewer while still using placeholder events.
- **Verification:** The screen recording/screenshots from Task 8 and the usability-check outcome
  from Task 6 are the proof, referenced by file path, not described.

### Rollback Plan

- If live push proves unreliable under demo conditions, a manual-refresh fallback (still real
  data, just not auto-pushing) is acceptable — document it as a deliberate trade-off, not a silent
  downgrade.

### Safety Checks

- [ ] No API keys or signer material exposed client-side in the UI's network requests
- [ ] Rate/concurrency limits and per-viewer job ownership actually tested, not just implemented
- [ ] Stories 1-7's underlying flows re-confirmed still working (re-run Story 7's script once more)

## Success Criteria

1. A real end-to-end run through the deployed public UI is captured and referenced as proof.
2. The 60-second usability check (AC 10) has a real, recorded outcome.
3. Economic panel and agent-activity stream data are confirmed real (traceable to an actual
   on-chain query / real model call), not hardcoded.
4. Every failure state (AC 8) has been actually triggered and captured, not just coded.
5. No secrets are exposed in the browser/network layer; abuse-protection limits are demonstrated.

## Verification (fill in when the work is actually done — do not pre-fill or fabricate)

```
$ <paste the actual command run, or reference to the recording/screenshot file>
<paste the actual output or file path>
```

Status after verification: **[ ] Not yet verified**
