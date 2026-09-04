# Story: End-to-End Job Flow Verification

<!-- Source: B_Create_Story.md task -->
<!-- Context: Epic 1 (Autopoiesis), Story 7 of 10 — proves the whole system works together -->
<!-- Revised 2026-09-03 after Codex adversarial review, docs/reviews/codex-adversarial-review-1.md §1.10, §3.9 -->

## Status: Draft — [ ] Not started (blocked on Story 6 completion)

## Story

As the engineer building Autopoiesis,
I want a scripted ACP Client to fund a real coding job and watch Autopoiesis complete it end to
end,
so that the epic's core success criteria — a working, paid, on-chain-settled coding job — is
proven live, not assumed from individually-passing prior stories.

## Context Source

- Source documents: `docs/epics/epic-1-autopoiesis.md` (Epic success criteria), Story 6 (Provider
  integration)
- Enhancement type: end-to-end verification, no new production functionality — this story exists
  specifically to catch integration gaps that per-story testing could miss
- Existing system impact: none broken; this is a test/verification pass over Stories 1-6's
  combined output

## Acceptance Criteria

1. A real job reaches `completed` state on Base Sepolia, with on-chain transaction hashes for both
   the `fund()` step and the settlement, pasted as proof.
2. Autopoiesis's wallet balance visibly increases by the expected fee share (95% with no evaluator
   designated, per the confirmed fee-split rule) — measured before/after, not assumed from the
   protocol's stated percentage.
3. Autopoiesis's ERC-8004 reputation record reflects the completed job, confirmed via the real
   interface Story 5 identified — with a real before/after comparison against Story 5's baseline —
   not assumed.
4. **(New — review §1.10)** An operational test matrix is run, not just one happy-path pass: 3
   consecutive clean job runs (measuring time-to-first-event and total duration for each), one run
   with a deliberately injected inference failure (e.g., a temporarily bad model id), one run that
   hits Story 3's sandbox timeout on purpose, and confirmation that none of these leave a job
   double-charged or permanently stranded in escrow.
5. **(New — review §3.9)** Because this story's Client acts as its own Evaluator, the story's
   documentation states this plainly — the `complete()` call here is a self-attested approval by
   the paying Client, not independent third-party evaluation. This limitation is carried into the
   epic/README framing, not glossed over.
6. **(New)** At least one deliberately-failing job (e.g., funding withheld, or a task designed to
   exceed the iteration cap) is run through to its real terminal state (`rejected` or `expired`),
   confirming Story 6's failure-transition table actually works, not just its happy path.
7. The Client wallet holds real testnet USDC obtained via the confirmed CDP MCP faucet (see Dev
   Technical Guidance) before attempting `fund()` — proven with a real balance check, not assumed.

## Dev Technical Guidance

### Existing System Context

Story 6 wired the Provider side. This story builds the Client side and runs the full loop once,
for real.

### Integration Approach

Per `research/RESEARCH.md` §7.2, a Client needs no separate registration — jobs are created via
`agent.createJobByOfferingName()` or `agent.createJob()` against the offering Story 6 listed.
Write a minimal script (can be a second, throwaway agent identity, or the same tooling used for
the Provider side) that:
1. Creates a job against Autopoiesis's listed offering.
2. Calls `fund()` once budget is set (requires testnet USDC — see Missing Information).
3. Waits for/observes `submitted` state.
4. Calls `complete()` (client acting as its own evaluator, since none was designated per Story 6's
   simple-first approach).

### Technical Constraints

- Job lifecycle states (confirmed): `open → budget_set → funded → submitted → completed` (or
  `rejected`/`expired`).
- Fee split confirmed: no Evaluator → Provider 95% / Protocol 5%.

### Missing Information

- **RESOLVED (2026-09-03):** Testnet USDC funding no longer needs exploration — the CDP MCP server
  is already connected in this environment and exposes `mcp__cdp__cdp_evm_faucet`
  (`POST /v2/evm/faucet`), which supports `network: "base-sepolia"`, `token: "usdc"` directly
  against any address. Call it with `{"network": "base-sepolia", "address": "<Client wallet
  address>", "token": "usdc"}`. Task 1 below now just executes this and confirms the resulting
  balance, rather than hunting for a faucet.
- Still open: whether the Client-side identity for this story is a second Virtuals agent (its own
  `acp agent create`) or a simpler CDP-managed EVM account (`mcp__cdp__cdp_evm_accounts_create`)
  used only to call `fund()` directly against the ACP escrow contract — decide in Task 2 based on
  whichever the SDK's `fund()` call actually requires (a Virtuals-registered signer, or any funded
  EVM account). Don't assume; check the SDK's `fund()` signature first.

## Tasks / Subtasks

- [ ] Task 1: Fund the Client wallet with testnet USDC
  - [ ] Decide the Client identity type (Virtuals agent vs. plain CDP EVM account — see Missing
        Information) based on what the SDK's `fund()` call actually requires
  - [ ] Call `mcp__cdp__cdp_evm_faucet` with `{"network": "base-sepolia", "address": "<Client
        wallet address>", "token": "usdc"}`; paste the real response
  - [ ] Confirm the Client wallet holds enough testnet USDC to fund a job; paste real balance
- [ ] Task 2: Write the Client script
  - [ ] `agent.createJobByOfferingName()` (or `createJob()`) against Autopoiesis's offering
  - [ ] Implement `fund()` call once budget is set
- [ ] Task 3: Run the full cycle live
  - [ ] Submit a real coding task through the Client
  - [ ] Observe and log every state transition: `open` → `budget_set` → `funded` → `submitted` →
        `completed`
  - [ ] Paste real transaction hashes for `fund()` and the final settlement
- [ ] Task 4: Confirm reputation update
  - [ ] Check Autopoiesis's ERC-8004 record post-completion (via explorer or `whoami`); paste
        real before/after comparison
- [ ] Task 5: Confirm wallet balance change
  - [ ] Record Autopoiesis's wallet balance immediately before and after job completion; confirm
        the increase matches the expected 95% fee share
- [ ] Task 6 (new — review §1.10): Operational test matrix
  - [ ] Run 3 consecutive clean jobs; record time-to-first-event and total duration for each
  - [ ] Run one job with a deliberately injected inference failure (e.g., temporarily point at a
        bad model id); confirm it fails cleanly, not silently
  - [ ] Run one job that deliberately hits Story 3's sandbox timeout; confirm clean failure
  - [ ] Confirm none of the above leaves a job double-charged or stranded in escrow indefinitely
- [ ] Task 7 (new — review §3.9): Document the evaluator limitation
  - [ ] Write the explicit self-attestation disclosure into this story and flag it for the README
- [ ] Task 8 (new): Run a deliberately-failing job to a real terminal failure state
  - [ ] Confirm `rejected` or `expired` is actually reached and escrow behaves as Story 6's
        transition table specifies; paste real evidence

## Risk Assessment

### Implementation Risks

- **Primary Risk (downgraded 2026-09-03):** Was "testnet USDC funding is unconfirmed" — now
  resolved via the CDP MCP faucet (see Missing Information). Remaining risk is narrower: whether
  the ACP SDK's `fund()` call expects the funding wallet to be a Virtuals-registered signer
  specifically, which isn't yet confirmed.
- **Mitigation:** Task 1 confirms the actual `fund()` requirement before assuming a plain
  CDP-funded EVM account is sufficient.
- **Verification:** Real faucet response and real resulting balance, pasted as proof.

### Rollback Plan

- Testnet only — a failed or stuck job can be abandoned; a new job can be created and retried with
  no real financial consequence.

### Safety Checks

- [ ] Confirmed testnet (Base Sepolia, chain-id 84532) throughout — no mainnet USDC/ETH spent
- [ ] All transaction hashes pasted are independently verifiable on a Base Sepolia block explorer

## Success Criteria

1. Every job-lifecycle state transition is logged with real evidence (timestamps + tx hashes where
   applicable).
2. Wallet balance and ERC-8004 record changes are both confirmed with real before/after data.
3. The testnet USDC funding path is documented clearly enough that Story 8 (dashboard) or a future
   demo run can repeat this without re-discovering it.
4. The operational test matrix (3 clean runs + 2 injected-failure runs) has real recorded results,
   and at least one job reaches a real `rejected`/`expired` terminal state.
5. The evaluator self-attestation limitation is documented plainly, not glossed over.

## Verification (fill in when the work is actually done — do not pre-fill or fabricate)

```
$ <paste the actual command run>
<paste the actual output, including transaction hashes>
```

Status after verification: **[ ] Not yet verified**
