# Story: Agent Token Launch + ERC-8004 Registration

<!-- Source: B_Create_Story.md task -->
<!-- Context: Epic 1 (Autopoiesis), Story 5 of 10, Track B — depends on Story 4's funded wallet -->
<!-- Revised 2026-09-03 after Codex adversarial review, docs/reviews/codex-adversarial-review-1.md §1.5, §1.12 -->

## Status: Draft — [ ] Not started (blocked on Story 4 completion)

## Story

As the engineer building Autopoiesis,
I want Autopoiesis's ERC-20 token (`AUTO`) launched via bonding curve on Base Sepolia, and its
ERC-8004 reputation record separately registered,
so that it has the tokenized economic identity that is the actual point of this project — this is
the story that makes it a "tokenized agent" rather than just an agent with a wallet.

## Context Source

- Source documents: `research/RESEARCH.md` §7.2 (verified tokenize flags, and the correction that
  ERC-8004 registration is NOT automatic), `PLAN.md` §3 and §9
- Enhancement type: new component, depends on Story 4's agent id + funded wallet
- Existing system impact: none prior to this story is broken by it; this story only adds

## Acceptance Criteria

1. `acp agent tokenize --chain-id 84532 --symbol AUTO` succeeds and returns a real transaction
   hash on Base Sepolia, pasted as proof.
2. `acp agent register-erc8004 --agent-id <id> --chain-id 84532` succeeds as a **separate** call —
   do not assume it happened automatically (this was a confirmed correction to earlier research).
3. The token symbol `AUTO` is confirmed on-chain (via `acp agent whoami --json` or a Base Sepolia
   block explorer), not just assumed from the command succeeding.
4. Story 4's wallet/identity state is confirmed still intact after this story (regression check).
5. **(New — review §1.12)** ERC-8004's actual reputation mechanics are confirmed by real
   exploration, not assumed: what field/event records a completed job, what triggers an update,
   and what interface (CLI, explorer, or SDK call) reads it back. This is documented with a real
   before/after comparison once Story 7 completes a job — if job completion does NOT automatically
   update whatever ERC-8004 exposes, that's recorded honestly here and in `PLAN.md`/the epic,
   rather than the plan continuing to assume it does.
6. **(New — review §1.5)** An environment manifest is written recording this agent's identity
   permanently: agent ID, wallet address, token contract address, chain ID, Service Registry
   offering ID. Because Virtuals allows only one token per agent per chain ever, this manifest is
   the recovery mechanism if anything about this identity needs to be reconstructed or re-pointed
   later — not "just re-run the command."

## Dev Technical Guidance

### Existing System Context

Story 4 produced a funded, registered agent wallet on Base Sepolia with a resolved path to testnet
VIRTUAL. This story spends that VIRTUAL to launch the token.

### Integration Approach

Verified command (source: `research/RESEARCH.md` §7.2, github.com/Virtual-Protocol/acp-cli
README):
```
acp agent tokenize --chain-id 84532 --symbol AUTO
```
Optional flags available if a richer launch is wanted later (not required for the demo):
`--anti-sniper 0`, `--prebuy 100` (VIRTUAL units), `--acf` (Capital Formation mode), `--60-days`
(reversible test-launch mode), `--airdrop-percent 2.5`, or `--configure` for an interactive flow.
Per `PLAN.md` §9's locked decision, keep the first launch simple (no `--acf`/`--prebuy`) to
minimize variables — a richer launch can be a stretch goal only after the basic flow is proven.

Then, as a **separate, required** step (confirmed correction — not automatic):
```
acp agent register-erc8004 --agent-id <id> --chain-id 84532
```

### Technical Constraints

- Base Sepolia chain-id is `84532` (Base Mainnet is `8453` — do not use mainnet per the locked
  testnet-only decision).
- Requires the wallet to hold ≥100 VIRTUAL (launch fee) plus enough ETH for gas — both established
  in Story 4.

### Missing Information

- Exact confirmation format for successful registration (what `register-erc8004` actually returns
  on success) was not pulled in research — Task 2 captures whatever it actually returns.

## Tasks / Subtasks

- [ ] Task 1: Confirm pre-launch balance
  - [ ] `acp agent whoami --json`; confirm ≥100 VIRTUAL and nonzero ETH gas balance before
        attempting tokenize (avoid a failed transaction burning gas for no result)
- [ ] Task 2: Launch the token
  - [ ] Run `acp agent tokenize --chain-id 84532 --symbol AUTO`
  - [ ] Paste the real returned transaction hash / confirmation output
  - [ ] Look up the transaction on a Base Sepolia block explorer; paste confirmation it landed
- [ ] Task 3: Register ERC-8004 separately
  - [ ] Run `acp agent register-erc8004 --agent-id <id> --chain-id 84532`
  - [ ] Paste the real output
- [ ] Task 4: Verify both on-chain
  - [ ] `acp agent whoami --json` (or explorer) confirming token symbol `AUTO` exists and is
        linked to this agent
  - [ ] Confirm ERC-8004 registration is visible/queryable (via whatever interface actually
        exposes it — document what's found)
- [ ] Task 5: Regression check
  - [ ] Re-run `acp agent whoami --json`; confirm wallet address/agent id from Story 4 is
        unchanged
- [ ] Task 6 (new — review §1.12): Explore and document ERC-8004 reputation mechanics
  - [ ] Find the real interface that exposes reputation/job-completion data for this agent
  - [ ] Record its state now (pre-Story-7, no completed jobs yet) as a baseline for later
        before/after comparison
- [ ] Task 7 (new — review §1.5): Write the environment manifest
  - [ ] Record agent ID, wallet address, token contract address, chain ID, offering ID in a
        durable, version-controlled (non-secret) file
  - [ ] Confirm no secret material is included in this manifest

## Risk Assessment

### Implementation Risks

- **Primary Risk:** Insufficient VIRTUAL/ETH balance causes the tokenize transaction to fail after
  Story 4 thought funding was resolved (e.g., faucet amount too small, or Story 4's VIRTUAL-source
  didn't actually work).
- **Mitigation:** Task 1 explicitly checks balance before attempting the spend, catching this
  before a failed on-chain transaction.
- **Verification:** Real balance check output pasted before the tokenize attempt.

### Rollback Plan

- Testnet only. If tokenize fails or is misconfigured, no real value is lost — a fresh agent id
  (via Story 4's flow) can be created and re-tokenized. One token per agent per chain, ever, so a
  botched launch cannot simply be "redone" on the same agent id — document this constraint clearly
  if it's hit, since it means a real do-over requires a new agent identity.

### Safety Checks

- [ ] Confirmed `--chain-id 84532` (testnet) used, not `8453` (mainnet) — check every command
      before running
- [ ] No private key or signer material appears in this story's pasted output

## Success Criteria

1. Real transaction hash for the tokenize call is pasted and confirmed on a block explorer.
2. Real output for the separate `register-erc8004` call is pasted.
3. Token symbol `AUTO` is confirmed on-chain via independent lookup, not just command success.
4. Story 4's identity state is confirmed unchanged (regression check passed).

## Verification (fill in when the work is actually done — do not pre-fill or fabricate)

```
$ <paste the actual command run>
<paste the actual output, including transaction hash>
```

Status after verification: **[ ] Not yet verified**
