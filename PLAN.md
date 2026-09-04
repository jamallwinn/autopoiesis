# Autopoiesis — Tokenized Coding Agent for the Nebius x NVIDIA Global AI Hackathon
Agent name: **Autopoiesis** · Ticker: **`AUTO`** (pronounced aw-toh-poy-EE-sis — Greek for
"self-creating/self-sustaining," chosen to match the pitch: an agent whose job fees and token
trading fees fund its own Nebius/NVIDIA compute).

Research + Architecture Plan — 2026-09-03, updated 2026-09-03. Status: **DRAFT, nothing built.**
Full sourcing in `research/RESEARCH.md`.

## 1. The finding that shapes everything

The hackathon has **no blockchain/crypto track or requirement**. Virtuals Protocol tokenization
is entirely our own addition on top of their brief — it must sit *on top of* a genuinely strong
Nebius/NVIDIA-native agent, not replace one, or it reads as off-brief no matter how polished.

The good news: there's a real, non-forced technical reason the two stacks belong together (§4),
not just "crypto plus AI because it sounds cool." That's the pitch.

**Naming collision — keep straight in every piece of pitch material:** Nebius "**Token Factory**"
(their LLM inference-serving product — sandboxes, serverless endpoints, nothing to do with crypto)
and Virtuals "**agent tokenization**" (minting an ERC-20 that represents an agent) share a word and
mean unrelated things. Conflating them in the demo video will visibly confuse judges.

## 2. Hackathon facts (source: nebiusglobalaihackathon.devpost.com/rules, /resources)

- **Dates:** Submissions open Aug 26, 2026 → close Oct 30, 2026, 10am PT. Judging Dec 1–15, 2026.
  Winners announced Jan 11, 2027.
- **Mandatory stack:** submission must (a) run on **Nebius Token Factory or Nebius AI Cloud**
  (Serverless Endpoints/Jobs, DevPods, or Token Factory Sandboxes) **and** (b) use **at least one
  NVIDIA open-source model** — Nemotron 3 (Ultra/Super/Nano), GR00T, Cosmos, Sonic; NemoClaw and
  Hermes Agent are called out specifically for the Personal AI track.
- **Four tracks:**
  1. **Coding and Agentic Engineering** — agents that write/run/test code in Token Factory Sandboxes.
  2. **Best Apps and Agents** — "any app or agent someone would actually use."
  3. **Personal AI** — always-on private assistant, persistent memory, user controls data.
  4. **Physical AI** — embodied/edge agents, robotics/IoT, requires hardware demo footage.
- **Judging (equally weighted):** Technological Implementation · Design · Potential Impact ·
  Quality of Idea.
- **Prizes:** Grand $20k / 2nd $10k / 3rd $6k overall; each track winner gets an NVIDIA Jetson
  Orin Nano; Best Use of Tavily $3k; 20× City Winner $500; 10× Most Valuable Feedback $100+swag.
  A project can win **one** Overall **or** one Track+Bonus — not both.
- **Submission must include:** working demo URL (waived for Physical AI), public repo with visible
  OSI license (MIT/Apache-2.0/MPL-2.0), README with setup/run instructions, a **<3-minute** public
  YouTube demo video that explicitly narrates the Nebius/NVIDIA usage, written feedback on the
  tooling, disclosure if built on pre-existing work.
- **Free credits:** $25 Token Factory credit (code `NEBIUS-DEVPOST-GLOBAL26`) + another $25 via the
  Nebius Builders Program (dev.nebius.com/builders), which also bundles AI Cloud/Tavily credit.
- **Unconfirmed — verify on the live Devpost rules tab before finalizing a team:** team-size cap,
  geographic eligibility exclusions.

## 3. Virtuals Protocol mechanics (source: os.virtuals.io/agent-identity/*, /acp/*)

**Agent Identity** (EconomyOS) = up to four components: a non-custodial **Agent Wallet** (EVM on
Base/Robinhood Chain, optional Solana), an **Agent Card** (real-world virtual payment card), an
**Agent Email**, and an optional **Agent Token**. Live chains: Base (8453) and Robinhood Chain
(4663) mainnet; Base Sepolia (84532) + BNB/Robinhood testnets for safe testing.

**Agent Token mechanics:**
- Tokenizing launches a tradeable **ERC-20**, one per agent per chain, ever.
- Price discovery via **bonding curve**; launch fee **100 VIRTUAL**; graduates to a permanent
  Uniswap V2 pool at **42,000 VIRTUAL** TVL, then liquidity locks for 10 years.
- ERC-8004 registration (on-chain reputation/identity standard) is available but **is a separate,
  explicit CLI call** (`acp agent register-erc8004`) — **correction, verified 2026-09-03**: it is
  NOT automatic on tokenize, as an earlier research pass assumed. See `research/RESEARCH.md` §2
  and §7.2. Registering it is what gives the agent a persistent trust record independent of token
  price.
- **Trading fees route to the agent's own wallet** — the agent is a real economic actor, not a
  passive mint recipient.
- Optional knobs: pre-buy, anti-sniper tax window, "Capital Formation" mode, 60-day reversible
  test-launch mode, 0–5% veVIRTUAL airdrop.

**Agent Commerce Protocol (ACP)** — reference implementation of the emerging **ERC-8183**
agent-commerce standard:
- Three roles: **Client** (requests), **Provider** (delivers), optional **Evaluator** (neutral
  approver; Client fills this role if none is designated).
- **Job lifecycle:** `open → budget_set → funded → submitted → completed` (or rejected/expired).
  Client funds an on-chain **USDC escrow** at `funded`; funds release automatically on approval.
- **Fee split, enforced on-chain:** no Evaluator → Provider 95% / Protocol 5%. With Evaluator →
  Provider 90% / Evaluator 5% / Protocol 5%.
- **Dev interfaces:** SDK `@virtuals-protocol/acp-node-v2`, CLI `@virtuals-protocol/acp-cli`. Both
  expose model-agnostic tool-calling primitives — `availableTools()`, `toMessages()`,
  `executeTool()` — the hook point for wiring in *any* LLM backend.

**Costs for a demo:** Base Sepolia testnet fully supports the launch flow at zero real cost;
graduating to a live Uniswap pool is not needed to demonstrate the mechanism. ACP job fees are
USDC-denominated and trivial at demo scale.

## 4. The seam that makes this one idea, not two bolted-together SDKs

Virtuals has its own hosted inference, **Agent Compute** (`compute.virtuals.io`, OpenAI-compatible,
~14 models incl. Claude/GPT/DeepSeek — **no NVIDIA Nemotron, no Nebius, no plugin path for outside
GPU providers**). That's a closed service by design.

But ACP's SDK doesn't require using it — it only needs something that satisfies
`availableTools()` / `toMessages()` / `executeTool()`. Nothing stops the agent's actual reasoning
loop from running against a **self-hosted OpenAI-compatible endpoint on Nebius AI Cloud / Token
Factory serving an NVIDIA Nemotron model**, while Virtuals is used purely for identity, wallet,
token, and on-chain commerce.

**Nebius + NVIDIA = the brain. Virtuals = the economic body.** That split satisfies the
hackathon's two mandatory requirements *and* delivers an actually-tokenized agent, and it's a
non-obvious use of both platforms — which is what "Quality of Idea" rewards. No existing
project pairing Virtuals tokenization with NVIDIA/Nebius-hosted inference was found — treat this
as a novel bridge, not a supported/documented integration.

## 5. End-to-end architecture (IT-architect view)

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. PRESENTATION / DEMO                                                │
│    Web UI: submit a request · watch agent reason/act live ·          │
│    live wallet balance + live token price/bonding-curve position     │
├─────────────────────────────────────────────────────────────────────┤
│ 2. AGENT ORCHESTRATION ("the brain")                                  │
│    Reasoning/tool-calling loop, satisfying ACP's                     │
│    availableTools()/toMessages()/executeTool() contract               │
│    LLM calls  → Nebius Token Factory / AI Cloud → NVIDIA Nemotron     │
│    Execution  → Token Factory Sandboxes (if coding-track) or tool     │
│                 calls (search/fetch/etc. for other service types)     │
├─────────────────────────────────────────────────────────────────────┤
│ 3. IDENTITY & ECONOMIC LAYER ("the body") — Virtuals EconomyOS/ACP    │
│    Agent Wallet → Agent Token (bonding curve) → separate ERC-8004    │
│    registration call (NOT automatic — verify per Story 5)             │
│    ACP marketplace: open → budget_set → funded (escrow) → submitted   │
│    → completed. Trading fees + job fees → agent's own wallet.         │
├─────────────────────────────────────────────────────────────────────┤
│ 4. COMPUTE / INFRA (hackathon-mandated)                               │
│    Nebius AI Cloud account · Token Factory project · Serverless       │
│    Endpoints (Nemotron Nano for dev loop, Super/Ultra for demo runs)  │
├─────────────────────────────────────────────────────────────────────┤
│ 5. CHAIN / WALLET LAYER                                               │
│    Base (mainnet 8453 or Sepolia testnet 84532) · agent's EVM wallet  │
│    · VIRTUAL for launch fee · USDC for job escrow · ETH for gas       │
│    · ERC-8004 registry · ACP Core contract                            │
├─────────────────────────────────────────────────────────────────────┤
│ 6. OBSERVABILITY / REPUTATION                                         │
│    ERC-8004 job/trust history · token price & holders (Base explorer  │
│    or app.virtuals.io) · surfaced back into layer 1                   │
└─────────────────────────────────────────────────────────────────────┘
```

## 6. Three perspectives

**Dev / architecture lens** — three loosely coupled services: *Brain* (Nebius Token Factory +
Nemotron, stateless, swappable), *Body/economy* (Virtuals EconomyOS — wallet, token, ACP
contracts on Base, owns all money movement and on-chain state), *Face* (a small web app — the
only piece a judge directly touches). Nothing depends on the others being anything specific: if
Nebius rate-limits during judging (which happens weeks after submission, per §2 dates), the
token/ACP layer still demos independently, and vice versa.

**Business perspective** — the pitch is "an agent that pays for its own existence." Two
independent revenue streams land in the same wallet: ACP job fees (95% of each job, or 90% with
an evaluator) and token trading fees. That flywheel — usage builds ERC-8004 reputation →
reputation drives trust and demand → job + trading fees fund more/better compute → better output
— is the "Potential Impact" story: not an AI chatbot, an agent with its own balance sheet.
Tokenizing also raises working capital up front via the bonding curve/pre-buy, aligning token
holders' upside with the agent's actual job performance rather than hype alone. This also creates
real financial/regulatory surface area the moment real money is involved (§9) — a deliberate
choice, not a default.

**End-user / agent journeys:**
- *Human requester:* opens the app → describes a task → agent reasons/acts live against
  Nebius+Nemotron → job funds and settles via ACP escrow → optionally buys the agent's token
  after seeing its ERC-8004 track record. A human never needs a wallet just to *use* the service
  — only to *invest* in it. Keeping those two flows separate is a real design decision worth
  calling out under the "Design" judging criterion.
- *Requesting agent (agent-to-agent case):* another autonomous agent opens a job, funds escrow,
  this agent executes and submits, evaluation releases funds and updates ERC-8004 reputation —
  no human or trusted intermediary required.
- *Token holder / observer:* finds the agent via app.virtuals.io or a DEX, reviews its ERC-8004
  job history before buying, earns a share of trading fees, has upside tied to execution quality.

## 7. Build plan (updated 2026-09-03 after Codex adversarial review — see
`docs/reviews/codex-adversarial-review-1.md`; full detail now lives in `docs/epics/` and
`docs/stories/`, this table is a summary only)

**No longer strictly linear.** Story 0 (preflight: eligibility, shared cross-system contract,
proven deployment target) is a hard prerequisite for everything else. After that, Track A
(brain: Stories 1-3) and Track B (economic body: Stories 4-5) run in parallel; Track C (license/
README-skeleton/deployment shell) starts early too. Story 6 is the merge point (needs Track A +
Track B), Story 7 depends on Story 6, Story 8's full data-wiring depends on Story 7, Story 9's
final packaging depends on Story 8.

| Story | Component | Notes |
|---|---|---|
| 0 | Preflight: eligibility gate, shared contract, deployment target | New — do this first |
| 1 | Nebius account + Token Factory API key | Apply both hackathon credit codes first |
| 2 | Nemotron reasoning loop — full bounded agent loop, not one-shot | Track A |
| 3 | Code execution — versioned SandboxAdapter, security-isolated | Track A |
| 4 | Virtuals Agent Identity — wallet, explicit signer custody policy | Track B, parallel to Track A |
| 5 | Agent Token launch + separate ERC-8004 registration + recovery manifest | Track B |
| 6 | ACP Provider integration — real multi-turn loop, failure/idempotency handling | Merge point (needs 3+5) |
| 7 | End-to-end verification — operational test matrix, not just one happy path | Needs 6 |
| 8 | Demo dashboard — journey-oriented, deployed to a real public URL | Shell early, full wiring needs 7 |
| 9 | Repo hygiene & submission — license/README/feedback can start early; video/submission need 8 | |

Only move from testnet (84532) to Base Mainnet (8453) once the full flow is proven — see §9.

Full acceptance criteria, tasks, and the Codex-review-driven corrections (idempotency, security
isolation, honest evaluator framing, corrected video-length wording, etc.) are in
`docs/stories/epic-1-story-0.md` through `epic-1-story-9.md` — treat this table as an index, not
the source of truth.

## 8. Judging-criteria self-check

- **Technological Implementation** — needs real runtime calls to Token Factory/Nemotron visible
  in the video (logs/latency), not a static claim.
- **Design** — needs an actual UI showing the request → reasoning → settlement loop, not a
  terminal transcript, to read as a coherent product.
- **Potential Impact** — depends entirely on picking a service people would actually want (§9).
- **Quality of Idea** — the differentiator is explicitly explaining *why* Nebius/NVIDIA-brain +
  Virtuals-economy is the architecture (§4), not just stacking two SDKs.

## 9. Decisions (locked 2026-09-03)

1. **Service**: **Coding agent** — writes/runs/tests code in Nebius Token Factory Sandboxes,
   sold as an ACP job.
2. **Track**: **Coding and Agentic Engineering** — the sandboxed coding-agent mechanics are
   exactly what this track describes; the Virtuals identity/token/ACP layer is the differentiator
   *within* the track, not a separate submission.
3. **Chain**: **Base Sepolia testnet (84532)** for the Agent Token launch and ACP escrow — zero
   real VIRTUAL/ETH cost, zero financial/regulatory exposure, full bonding-curve + ACP flow
   identical to mainnet. Revisit mainnet only if there's a deliberate reason to want a real
   tradeable artifact after the core loop is proven.
4. **Team**: solo build.
5. **Name/ticker**: **Autopoiesis** / `AUTO`.

### What the coding agent concretely does
User (or a second requesting agent) submits a coding task → agent (Nemotron via Nebius Token
Factory) plans → writes code → executes it in a Token Factory Sandbox → tests/iterates → returns
the working result as the ACP job deliverable, escrow releases, ERC-8004 reputation updates. This
keeps the loop real and inspectable on camera: sandboxed execution output, test results, and the
escrow settlement are all visible, not a single-shot code snippet.

## 10. Other risks flagged

- **Off-brief risk:** since tokenization isn't asked for, the video/README must foreground the
  Nebius/NVIDIA mechanics first and the Virtuals layer second, or judges may not credit it.
- **Wallet key custody:** the agent's signer key must never be hardcoded or committed — Story 4
  now defines an explicit custody policy (permissions, dev/demo signer separation, rotation) after
  Codex's review flagged this as underspecified.
- **Team size / eligibility specifics:** now gated in Story 0, before any build work starts, with
  a final re-check in Story 9 — was previously deferred until the end.
- **Testnet USDC/ETH funding:** resolved via the CDP MCP server already connected in this
  environment (`mcp__cdp__cdp_evm_faucet`) — see `research/RESEARCH.md` §7.2 and Stories 4/7.

## 11. Status

Research complete, plan drafted, decisions locked (§9), and the full plan has passed one round of
adversarial review by OpenAI Codex (`docs/reviews/codex-adversarial-review-1.md`, run
2026-09-03). **Nothing built** — no repo (beyond this planning folder), no Nebius account setup,
no wallet, no token.

Full engineering breakdown now lives in:
- `docs/epics/epic-1-autopoiesis.md` — the epic, with epic-level acceptance/success criteria,
  updated post-review with parallel build tracks and corrected risk framing.
- `docs/stories/epic-1-story-0.md` through `epic-1-story-9.md` — 10 implementation-ready stories
  (Story 0 is new, added post-review), each with acceptance criteria, dev technical guidance
  (exact verified commands, from `research/RESEARCH.md` §7), tasks/subtasks, risk assessment, and
  a terminal-verifiable Success Criteria + Verification section.
- `docs/architecture/shared-contract.md` — not yet written; this is Story 0's primary deliverable,
  the single versioned schema (`ToolInvocation`, `SandboxAdapter`, `write_file`/`run_command`,
  `VerificationResult`, dashboard event types) that Stories 2, 3, 6, and 8 all implement against,
  added because Codex's review found those stories had each independently invented incompatible
  schemas in the original draft.
- `docs/reviews/codex-adversarial-review-1.md` — the full adversarial review report, for reference.

All 10 stories are currently `[ ]` Draft / not started. Per your instruction, a story's checkbox
only flips to `[x]` after its Verification section is filled in with real, pasted terminal
output/transaction hashes — never on the strength of a description alone. Every story's build
order also re-verifies the prior story's proof still holds before being marked done, so
regressions can't hide.
