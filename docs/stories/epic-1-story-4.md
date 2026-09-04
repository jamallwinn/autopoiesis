# Story: Virtuals Agent Identity — Wallet Setup on Base Sepolia

<!-- Source: B_Create_Story.md task -->
<!-- Context: Epic 1 (Autopoiesis), Story 4 of 10, Track B — blocked only on Story 0; independent of Track A (Stories 1-3) -->
<!-- Revised 2026-09-03 after Codex adversarial review, docs/reviews/codex-adversarial-review-1.md §1.6-1.7 -->

## Status: Draft — [ ] Not started (blocked on Story 0)

## Story

As the engineer building Autopoiesis,
I want a real, funded Base Sepolia testnet wallet registered as a Virtuals agent identity,
so that Autopoiesis can hold funds, sign for tokenization and ACP actions, and exist as an
addressable on-chain identity before any tokenization or commerce wiring happens.

## Context Source

- Source documents: `research/RESEARCH.md` §7.2 (verified CLI commands), `PLAN.md` §9 (locked
  decision: Base Sepolia testnet only)
- Enhancement type: new component; independent of Stories 1-3 (can be built in parallel, but this
  epic sequences it after the brain is proven, per `PLAN.md` §7's build order)
- Existing system impact: none — first on-chain artifact in the project

## Acceptance Criteria

1. `acp agent whoami --json` returns a real agent id and wallet address on Base Sepolia
   (chain-id 84532).
2. The wallet holds a nonzero Base Sepolia ETH balance, confirmed via a real faucet transaction or
   balance check — not assumed.
3. The path to obtaining testnet VIRTUAL (for the Story 5 launch fee) is confirmed by actually
   running `acp topup --help` and documenting the real behavior — this was explicitly unconfirmed
   in research and must not be assumed.
4. The signer private key obtained from the Agent Console's Signers tab is stored only in local,
   gitignored secrets — never committed, never pasted into any story file.
5. **(New — review §1.6)** An explicit custody policy is written and followed: what the
   `--policy restricted` flag actually restricts (confirmed by reading real CLI output/docs, not
   assumed), the secret file's real filesystem permissions (e.g., `chmod 600`), a separate signer
   used for local dev vs. the deployed demo (so a leaked dev credential doesn't compromise the
   live demo), and a documented, tested revoke/rotate procedure (can a new signer be attached and
   the old one revoked without re-creating the whole agent identity? — confirm by trying it).
6. **(New — review §1.7)** Secret-safety verification uses a real history-aware scan (e.g.,
   `git log -p | grep`, or a scanner like `gitleaks`/`trufflehog` if available), not a plain grep
   of the working tree only — the working tree can be clean while a secret still sits in an
   earlier commit.

## Dev Technical Guidance

### Existing System Context

Nothing on-chain exists yet. This is the first story to touch Virtuals Protocol.

### Integration Approach

Per `research/RESEARCH.md` §7.2, this is a CLI-driven flow, not a web-console-only flow:
1. Install: `npm i -g @virtuals-protocol/acp-cli` — confirm this exact package, NOT the deprecated
   `@virtuals-protocol/acp-node` (no `-v2`).
2. Set `IS_TESTNET=true` in the environment.
3. `acp configure` (interactive) — or scripted: `acp configure start --json` then
   `acp configure complete --request-id <id> --json`.
4. `acp agent create --name "Autopoiesis" --description "<coding agent description>" --image
   "<image URL, TBD>"`.
5. `acp agent add-signer [--agent-id <id> --policy restricted]` — this step requires visiting the
   Agent Console (app.virtuals.io) Signers tab to retrieve the actual `signerPrivateKey` — a
   manual web step, not pure CLI.
6. `acp agent use --agent-id <id>` to set active context.
7. `acp agent whoami --json` to verify.

### Technical Constraints

- The wallet is **Privy-managed**, not a self-generated keypair — the SDK's provider adapter
  (`PrivyAlchemyEvmProviderAdapter`) needs `walletAddress`, `walletId` (Privy identifier), and
  `signerPrivateKey`. Do not attempt to generate a keypair independently; use the flow above.
- Relevant env vars: `ACP_CONFIG_DIR` (default `~/.config/acp`), `IS_TESTNET=true`, `PARTNER_ID`,
  `ACP_DASHBOARD_URL`.
- **Testnet ETH — confirmed, available directly via CDP MCP tool** (`mcp__cdp__cdp_evm_faucet`,
  `POST /v2/evm/faucet`): call with `{"network": "base-sepolia", "address": "<wallet address>",
  "token": "eth"}`. This is now the primary path — no need to visit an external faucet UI.
  Fallback public faucets (Coinbase Developer Platform web UI, Alchemy, thirdweb) remain available
  if the MCP tool is rate-limited.

### Missing Information

- Exact behavior of the CLI's `topup` wallet subcommand (does it dispense testnet VIRTUAL, or only
  forward from an external source?) — unconfirmed by research; Task 4 below resolves this by
  actually running `acp topup --help`.
- Exact image URL requirement/format for `acp agent create --image` not confirmed — treat as an
  exploration item in Task 2.

## Tasks / Subtasks

- [ ] Task 1: Install and configure the CLI
  - [ ] `npm i -g @virtuals-protocol/acp-cli` (confirm version installed)
  - [ ] Set `IS_TESTNET=true`
  - [ ] Run `acp configure` (or the scripted start/complete pair); paste real output
- [ ] Task 2: Create the agent identity
  - [ ] `acp agent create --name "Autopoiesis" --description "..." --image "..."` — determine
        real `--image` requirement by trial; paste real output including the returned agent id
- [ ] Task 3: Attach a signer
  - [ ] `acp agent add-signer --agent-id <id> --policy restricted`
  - [ ] Visit Agent Console Signers tab, retrieve `signerPrivateKey`
  - [ ] Store `walletAddress`, `walletId`, `signerPrivateKey` in local gitignored secrets (never in
        this story file)
  - [ ] `acp agent use --agent-id <id>`
  - [ ] `acp agent whoami --json` — paste output with the private key value redacted
- [ ] Task 3.5 (new — custody policy, review §1.6): Define and test signer custody
  - [ ] Confirm what `--policy restricted` actually restricts (real CLI docs/output, not assumed)
  - [ ] Set real file permissions on the local secret store; confirm with `ls -l`
  - [ ] Create a separate signer for local dev vs. deployed demo use
  - [ ] Test the revoke/rotate procedure once for real; document exact steps and outcome
- [ ] Task 4 (exploration): Resolve testnet VIRTUAL funding
  - [ ] Run `acp topup --help`; paste real output
  - [ ] Follow whatever real process it documents (or, if it doesn't dispense VIRTUAL, find and
        document the actual working alternative — e.g., a Discord faucet or app.virtuals.io flow)
- [ ] Task 5: Fund with Base Sepolia ETH
  - [ ] Call `mcp__cdp__cdp_evm_faucet` with `{"network": "base-sepolia", "address": "<wallet
        address from Task 3>", "token": "eth"}`; paste the real response
  - [ ] Confirm nonzero balance via `acp agent whoami --json` or a Base Sepolia block explorer;
        paste real balance

## Risk Assessment

### Implementation Risks

- **Primary Risk:** Testnet VIRTUAL funding path is unconfirmed and could block Story 5 (the
  tokenize command requires 100 VIRTUAL).
- **Mitigation:** Task 4 resolves this early, in this story, rather than discovering the blocker
  when Story 5 starts.
- **Verification:** Real `acp topup --help` output and the real funding result, pasted verbatim.

### Rollback Plan

- Testnet-only, no real funds at risk (per `PLAN.md` §9 locked decision). If agent creation is
  botched, `acp agent create` can simply be re-run for a fresh agent id — no cleanup needed on a
  testnet.

### Safety Checks

- [ ] `signerPrivateKey` and any other secret confirmed NOT present in this story file, in
      `research/RESEARCH.md`, or in any git-tracked file (working tree AND history) — before
      considering this story done
- [ ] `IS_TESTNET=true` confirmed set for every command in this story (never accidentally targets
      mainnet)

## Success Criteria

1. `acp agent whoami --json` output (secrets redacted) is pasted, showing a real Base Sepolia
   agent id and wallet address.
2. Wallet's nonzero Base Sepolia ETH balance is confirmed with real evidence.
3. The real, tested answer to "how do we get testnet VIRTUAL" is documented — not assumed.
4. A repo-wide secret grep confirms no key material was committed.

## Verification (fill in when the work is actually done — do not pre-fill or fabricate)

```
$ <paste the actual command run — redact any secret values>
<paste the actual output>
```

Status after verification: **[ ] Not yet verified**
