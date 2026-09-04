# Epic 1: Autopoiesis — Tokenized Coding Agent

<!-- Created via .claude/commands/B_Create_Epic.md -->
<!-- Source docs: research/RESEARCH.md, PLAN.md -->

Status: Draft — not started. Zero stories complete as of 2026-09-03.

**Update 2026-09-03:** This epic and all story files were revised after an adversarial review by
OpenAI Codex (`docs/reviews/codex-adversarial-review-1.md`). Key changes: added Story 0
(preflight eligibility gate + shared cross-system contract + proven deployment target, done
*before* Story 1); replaced false linear sequencing with parallel build tracks; corrected an
overclaimed "zero risk" framing; added explicit security/custody/idempotency/failure-handling
requirements throughout; reworked Story 8's dashboard from a component layout into a
journey-oriented one; fixed a `<3-minute` vs `≤3-minute` compliance error. Every change below is
traceable to a numbered item in the review file.

## Epic Title

Autopoiesis — Tokenized Coding Agent for the Nebius x NVIDIA Global AI Hackathon

## Epic Goal

Build and demo one working agent, named **Autopoiesis** (`AUTO`), that (1) reasons and writes/
executes/tests code using an NVIDIA Nemotron model served on Nebius Token Factory, and (2) exists
as a real on-chain economic actor via Virtuals Protocol — a wallet, a tokenized ERC-20
(bonding-curve launch on Base Sepolia), and an ERC-8004 reputation record — able to accept and get
paid for coding jobs through the Agent Commerce Protocol (ACP) escrow flow. This satisfies both of
the hackathon's mandatory requirements (Nebius platform + an NVIDIA open-source model) while
delivering an actually-tokenized agent, entered in the **Coding and Agentic Engineering** track.

## Epic Description

**Existing System Context:**

- Current relevant functionality: none — this is a new, greenfield project. Project folder
  (`a_aa__nvidia_nebius`) currently contains only planning docs (`PLAN.md`, `research/RESEARCH.md`)
  and a Nebius API key in `.env` (as `nebius_api_key`, needs aliasing to `NEBIUS_API_KEY`).
- Technology stack: Nebius Token Factory (OpenAI-compatible inference API + Contree/Sandboxes for
  code execution, currently Beta) serving NVIDIA Nemotron models; Virtuals Protocol ACP CLI/SDK
  (`@virtuals-protocol/acp-cli`, `@virtuals-protocol/acp-node-v2`) on Base Sepolia testnet
  (chain-id 84532) for identity, tokenization, and commerce; Node.js/TypeScript for the ACP-facing
  service (SDK is JS/TS); Python acceptable for the Nebius-facing reasoning loop if kept behind an
  HTTP boundary the Node ACP service calls — see Story 2 for the concrete decision point.
- Integration points: Nebius Token Factory inference API ↔ agent reasoning loop; Token Factory
  Sandboxes (Contree) ↔ code execution/testing; ACP `JobSession` (`availableTools()`/
  `toMessages()`/`executeTool()`) ↔ the same reasoning loop, as the bridge between the agent's
  brain and its on-chain commerce identity.

**Enhancement Details:**

- What's being added: a full new system — reasoning service, sandboxed code execution, on-chain
  identity/token/commerce wiring, a minimal demo dashboard, and hackathon submission packaging.
- How it integrates: three loosely-coupled pieces (brain / economic body / face — see
  `PLAN.md` §5–6) that can each be demoed independently if one is degraded during judging.
- Success criteria: a human (or a second script acting as an ACP Client) can submit a coding task
  through the dashboard, watch Autopoiesis reason and execute code live against Nebius/Nemotron in
  a Contree sandbox, see the ACP job fund → submit → complete with on-chain escrow settlement on
  Base Sepolia, and see Autopoiesis's wallet balance and bonding-curve token position update as a
  result — end to end, operationally verifiable in the terminal at every stage, not just claimed.

## Stories

**Build order is now parallel-track, not strictly linear** (Codex review §1.1 — the original
linear order left no slack if Contree or ACP proved harder than expected, since the dashboard,
deployment, README, license, and video work were all blocked behind the hardest technical stories
for no real reason). Story 0 is a hard prerequisite for everything else. After that:

- **Track A (brain):** Story 1 → Story 2 → Story 3.
- **Track B (economic body):** Story 4 → Story 5. Independent of Track A — can run concurrently.
- **Track C (packaging, start early):** Story 9's license/README-skeleton/eligibility-recheck
  tasks and Story 8's deployment target (already proven in Story 0) can start as soon as Story 0
  is done, in parallel with Tracks A and B — don't wait for a finished dashboard to start repo
  hygiene.
- **Merge point:** Story 6 depends on Track A (Story 3) and Track B (Story 5). Story 7 depends on
  Story 6. Story 8's full data-wiring (not its shell/deployment) depends on Story 7. Story 9's
  final packaging (video, submission) depends on Story 8.

0. **[x] Story 0 — Preflight: Eligibility Gate, Shared Contract, Deployment Target** *(new, added
   after Codex review)* — **VERIFIED COMPLETE 2026-09-03.** Eligibility re-checked against the
   live Devpost rules (no disclosed conflicts; residency and judge/employment relation flagged for
   human self-certification); `docs/architecture/shared-contract.md` v0.1 written; GitHub Pages
   deployment proven live at https://jamallwinn.github.io/autopoiesis/ (repo:
   https://github.com/jamallwinn/autopoiesis). Full evidence in
   `docs/stories/epic-1-story-0.md`. Note: GitHub Pages is static-only — Story 8 still needs to
   pick a backend host for the real dashboard's API/SSE layer.
1. **Story 1 — Nebius Token Factory Account, API Key & Model Discovery**: create/confirm the
   Nebius account, resolve the API key naming and base-URL discrepancy, and confirm the real
   Nemotron model ID strings via a live `GET /v1/models` call.
2. **Story 2 — Standalone Nemotron Reasoning Loop**: a full bounded agent loop (`runAgentTask()`,
   not a single reasoning step) against the confirmed Nebius/Nemotron endpoint, producing
   normalized `ToolInvocation`s per Story 0's contract, with zero sandbox/chain involvement,
   tested standalone against a broad failure-mode matrix (not just auth failures).
3. **Story 3 — Code Execution via Token Factory Sandboxes (Contree)**: a versioned
   `SandboxAdapter` implementation (per Story 0's contract) giving the reasoning loop real,
   security-isolated write/execute/test capability against a Contree sandbox — local execution is
   dev-only, not a substitute for a real Contree run.
4. **Story 4 — Virtuals Agent Identity: Wallet Setup on Base Sepolia**: `acp configure` →
   `acp agent create` → `acp agent add-signer` → `acp agent use` → `acp agent whoami`, producing a
   real funded testnet wallet with an explicit signer-custody policy.
5. **Story 5 — Agent Token Launch + ERC-8004 Registration**: `acp agent tokenize` (bonding curve,
   symbol `AUTO`), the separate, required `acp agent register-erc8004` call, and an environment
   manifest recording the resulting identity (recovery plan for the one-token-per-agent-per-chain
   constraint).
6. **Story 6 — ACP Provider Integration**: list Autopoiesis's coding-job offering on the Service
   Registry and wire the Story 2/3 reasoning+execution loop into ACP's `JobSession` lifecycle as
   Provider — with a real multi-turn loop, a defined submission gate, and explicit
   failure/timeout/idempotency handling (this story was substantially reworked after Codex found
   it was under-specified at exactly the point where the brain and economic body actually meet).
7. **Story 7 — End-to-End Job Flow Verification**: a scripted ACP Client funds a real job, watches
   Autopoiesis execute it in a sandbox, and confirms escrow settlement + reputation update, plus an
   operational test matrix (repeat runs, injected failures) — not just one happy-path pass.
8. **Story 8 — Demo Dashboard**: a journey-oriented (not component-oriented) web UI — job timeline,
   ACP payment stepper, sanitized Nemotron reasoning stream, plain-language economic panel with a
   "Technical proof" disclosure, deliverable view, and failure-state UX — deployed to a real public
   URL.
9. **Story 9 — Repo Hygiene & Hackathon Submission Packaging**: OSI license, README (split into
   safe-to-reproduce sections), tooling feedback write-up, a demo video strictly under 3:00,
   deployment verification, history-aware secret scan, Devpost submission under Coding and
   Agentic Engineering.

## Compatibility Requirements

- [ ] N/A — greenfield project, no existing APIs/schema/UI to preserve. (Retained as a checklist
      item per the epic template; each story below still verifies prior stories weren't broken.)
- [ ] Every story after Story 1 must re-verify the previous story's operational proof still passes
      before being marked complete (regression discipline, since this is one continuous build).

## Risk Mitigation

- **Primary Risk (technical):** Two beta/undocumented surfaces sit on the critical path — Nebius
  Token Factory Sandboxes (Contree, confirmed Beta, no stable REST contract found) and Virtuals'
  ACP SDK's exact runtime behavior with a non-Anthropic LLM (no official example exists for this
  exact pairing, and Codex's review found the original Story 6 draft assumed the wrong response
  shape for this reason). Either could behave differently than the docs suggest.
- **Secondary Risk (integration):** Per Codex review §2/§3, the brain (Stories 2/3) and economic
  body (Stories 4/5) were originally designed with independently-invented schemas that were never
  confirmed to match at the Story 6 merge point — the highest-probability failure mode in this
  plan isn't any single story failing, it's two individually-passing stories not fitting together.
- **Tertiary Risk (security/compliance):** No original story defined resource isolation for
  executing model-generated code, secret-custody policy, or a public-facing rate-limit/auth
  boundary — all now addressed explicitly per-story (Stories 3, 4, 6, 8).
- **Mitigation:** Story 0 now defines one shared, versioned contract that Stories 2/3/6/8 all
  implement against, closing the integration-risk gap before it can occur. Each story that touches
  an unverified surface still includes an explicit exploration/discovery task before the
  implementation task. Security/custody requirements are now explicit acceptance criteria, not
  implied.
- **Rollback Plan:** Every on-chain action (Stories 4–7) happens on Base Sepolia testnet only — no
  real funds, no mainnet action. **Correction (Codex review §1.5):** "fully repeatable" was an
  overclaim — Virtuals allows only one token per agent per chain, ever, so a botched Story 5
  tokenize is not simply re-runnable against the same agent identity. Story 5 now maintains an
  environment manifest (agent ID, wallet, token, offering, chain) so a full re-point to a fresh
  agent identity is a known, practiced procedure rather than a scramble if it's ever needed.

## Definition of Done

- [ ] All 10 stories (0 through 9) completed with acceptance criteria met and operationally
      verified in the terminal (commands + actual output, not description)
- [ ] The full loop in "Success criteria" above is demonstrable live, not just individually per
      story
- [ ] The Story 0 shared contract (`docs/architecture/shared-contract.md`) is actually followed by
      Stories 2, 3, 6, and 8 — verified by a real end-to-end contract test (Story 6/7), not just by
      each story's own isolated tests passing
- [ ] Every unverified item flagged in `research/RESEARCH.md` §7 has been resolved (confirmed or
      worked around) by the story whose task list addresses it
- [ ] A real, public HTTPS demo URL is deployed and reachable from off the dev machine (hackathon
      hard requirement — was missing from the original plan per Codex review §1.2)
- [ ] Sandbox execution has an explicit resource-isolation/security spec implemented and tested
      (Codex review §1.8) — not just "strict resource limits" as an unexamined phrase
- [ ] Signer/secret custody policy is explicit and enforced (Codex review §1.6/§1.7) — a plain
      `grep` for the secret value is not sufficient verification
- [ ] ACP failure/timeout/idempotency handling exists and is tested, not just the happy path
      (Codex review §3.5/§3.6)
- [ ] Repo hygiene requirements from the hackathon rules (license, README, video strictly under
      3:00, feedback) are met
- [ ] No fabricated claims of completion anywhere in the story files — each checked box has a
      cited terminal command + output as proof

## Validation Checklist

**Scope Validation:** This is a 9-story epic, larger than the "1-3 stories" B_Create_Epic
template targets for small enhancements — appropriate here because this is the project's entire
build, not an enhancement to an existing system, and the user explicitly asked for full
first-to-last-story coverage. Flagging this deliberately rather than silently ignoring the
template's scope guidance.

**Risk Assessment:** Elevated risk from two beta/undocumented integration surfaces, plus the
integration-mismatch and security/custody gaps found by Codex's review (see Risk Mitigation
above), is real and acknowledged, not hidden. Real-money financial risk is eliminated by the
testnet-only decision (`PLAN.md` §9) — but testnet is not zero-risk in every sense: identity/token
launches are still one-shot per chain (see the corrected Rollback Plan above).

**Completeness Check:** Epic goal is clear and directly traceable to `PLAN.md` §5 (architecture)
and §7 (build plan). Stories are sequenced so each depends only on prior stories' verified output.
Success criteria are measurable and terminal-verifiable, per story.

## Story Manager Handoff

"Please implement Story 0 first, then Tracks A/B/C in parallel where possible (see Stories
section above for the track breakdown), merging at Story 6. Key considerations:

- This is a **new** system (Node.js/TypeScript for the ACP-facing layer and the Nebius-facing
  reasoning layer — decided in Story 2, to avoid a cross-language boundary with the ACP SDK).
- Integration points: Nebius Token Factory (inference + Contree sandboxes) is the agent's brain;
  Virtuals ACP (wallet, token, job escrow) is its economic body; they meet at the
  `availableTools()`/`toMessages()`/`executeTool()` bridge, normalized through the
  `ToolInvocation` contract Story 0 defines in `docs/architecture/shared-contract.md` — do not let
  any story invent its own competing schema for tool calls, sandbox execution, or dashboard events.
- Existing patterns to follow: Story 0's contract is the first real pattern; every later story
  implements against it rather than deriving its own.
- Critical compatibility requirements: testnet-only (Base Sepolia, chain-id 84532) for all
  on-chain actions per the locked decision in `PLAN.md` §9; never hardcode secrets — `.env`/a
  proper secrets store only, never committed, with a defined custody policy (Story 4).
- Each story must include a terminal-verifiable proof of completion, and the box in the story file
  only gets checked after that proof is actually captured — not before, not on the assumption it
  will work.
- ACP failure paths (`rejected`/`expired`), idempotency, and the sandbox's security/resource
  isolation are first-class requirements now, not stretch goals — see Story 6 and Story 3.

The epic should deliver Autopoiesis as a real, demoable tokenized coding agent with an honestly
scoped economic story — an on-chain revenue-accounting prototype, not an overclaimed 'self-funding'
system (see the corrected Success Criteria below)."

## Success Criteria

The epic is successful when:

1. A coding task submitted through the Story 8 dashboard, deployed at a real public HTTPS URL, is
   actually reasoned about and executed by Nemotron-on-Nebius via a full bounded agent loop, with
   real Contree sandbox output (pass/fail test results), not a mock.
2. A real ACP job (Story 7) funds, executes, and settles on Base Sepolia testnet with an on-chain
   transaction hash as proof. **Scope correction (Codex review §1.12):** the reputation claim is
   verified against whatever ERC-8004's actual, confirmed query interface shows (Story 5/6's
   exploration task) — not assumed to update automatically.
3. Autopoiesis's Agent Token (`AUTO`) exists on Base Sepolia via a real `acp agent tokenize`
   transaction, independently checkable via a block explorer or `acp agent whoami --json`.
4. Every story's completion is backed by a pasted terminal command + its actual output in the
   story file — no story is marked `[x]` on the strength of a description alone.
5. The demo video (strictly under 3:00 — see the corrected wording throughout Story 9) and README
   clearly separate what's Nebius/NVIDIA-mandated from what's the Virtuals tokenization layer, per
   the naming-collision warning in `PLAN.md` §1.
6. **Scope correction (Codex review §1.11):** the pitch describes Autopoiesis as an "on-chain
   revenue-accounting prototype" whose job/trading fees are demonstrably tracked reaching its
   wallet — it does NOT claim to be literally self-funding its own future compute unless a real
   cost ledger (Story 7) actually measures and shows that margin; an unproven stronger claim is not
   used even though it's the more exciting pitch line.
7. Sandbox code execution has a demonstrated, tested security boundary (Story 3), and ACP job
   handling has demonstrated failure/timeout/idempotency behavior (Story 6/7), not just a
   happy-path demo.
