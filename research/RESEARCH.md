# Research: Nebius x NVIDIA Global AI Hackathon + Virtuals Protocol Agent Tokenization

Saved 2026-09-03. Source of truth for the architecture plan in `PLAN.md`.

## 1. Nebius x NVIDIA Global AI Hackathon — official rules

Source: https://nebiusglobalaihackathon.devpost.com/rules , https://nebiusglobalaihackathon.devpost.com/resources

**Dates**: Submissions open Aug 26, 2026 → close Oct 30, 2026 (10am PT). Judging Dec 1–15, 2026. Winners announced Jan 11, 2027.

**Mandatory technical requirements**:
- Must run on **Nebius Token Factory** or **Nebius AI Cloud** (runtime calls to Token Factory inference API, or deployed via Serverless Jobs / Endpoints / DevPods).
- Must use **at least one NVIDIA open-source model** — named examples: Nemotron (3 Ultra, Super, Nano), GR00T, Cosmos, Sonic. NemoClaw and Hermes Agent called out specifically for the Personal AI track.
- No mention anywhere of Web3/crypto/blockchain requirements or partner integrations — Virtuals Protocol is **not** an official sponsor tool. Any tokenization layer is purely our own addition, judged under "Quality of Idea" / "Potential Impact," not a required checkbox.

**Four tracks**:
1. Coding and Agentic Engineering — coding agents/dev tools in Token Factory Sandboxes.
2. Best Apps and Agents — "any app or agent someone would actually use."
3. Personal AI — always-on private assistant, user controls data.
4. Physical AI — embodied/edge agents (robotics, IoT, on-device).

**Submission must include**: working demo URL (Physical AI exempt), feature write-up, public repo (GitHub/GitLab/Bitbucket) with source + assets + setup instructions, an OSI license file visibly displayed (Apache-2.0, MIT, or MPL-2.0), README, a **<3 minute** YouTube demo video, track selection, feedback on Nebius/NVIDIA tooling.

**Judging (Stage 2, equally weighted)**: Technological Implementation (effective use of Token Factory/AI Cloud + Nemotron/open models) · Design (coherent product, not a bare tech demo) · Potential Impact (credible real audience/problem) · Quality of Idea (creative, non-obvious use of the required platforms).

**Prizes**: Grand $20k / 2nd $10k / 3rd $6k (overall). Each track winner: 1x NVIDIA Jetson Orin Nano. Bonus: Best Use of Tavily $3k, 20x City Winner $500, 10x Most Valuable Feedback $100+swag. A project can win one Overall OR one Track + one Bonus award, not stack Overall+Track.

**Free resources**: $25 Token Factory credit (code `NEBIUS-DEVPOST-GLOBAL26`) + another $25 via Nebius Builders Program (dev.nebius.com/builders), plus Nebius AI Cloud/Tavily credits bundled in the Builders Program.

## 2. Virtuals Protocol — Agent Identity & Agent Token

Source: https://os.virtuals.io/agent-identity/token/overview , /agent-identity/overview

**Agent Identity** = a composite identity layer in Virtuals' "EconomyOS," four components:
1. **Agent Wallet** — EVM (Base, Robinhood Chain) + optional Solana; non-custodial, cryptographic signer required per machine.
2. **Agent Card** — virtual payment card (Alchemy-powered) for real-world purchases/subscriptions.
3. **Agent Email** — `agent@agents.world` address for programmatic comms.
4. **Agent Token** — optional, described below.

Identity is distinct from "ACP Capabilities" (the dynamic services/offerings an agent advertises, which can change without touching identity).

Live chains: Base (8453) and Robinhood Chain (4663) mainnet; Base Sepolia (84532) + BNB/Robinhood testnets for testing.

**Agent Token mechanics**:
- Tokenizing an agent launches a **tradeable ERC-20** on one chain (one token per agent per chain, max).
- **CORRECTION (verified 2026-09-03 against github.com/Virtual-Protocol/acp-cli README):** ERC-8004
  registration is **NOT automatic** on tokenize. It is a separate, required CLI command:
  `acp agent register-erc8004 --agent-id <id> --chain-id 84532`. Any earlier statement in this
  file or PLAN.md saying registration is automatic is wrong — treat it as its own build step.
- **Bonding curve** price discovery pre-launch; launch fee **100 VIRTUAL**; graduates to a permanent Uniswap V2 pool once the curve hits **42,000 VIRTUAL** TVL, liquidity then locked 10 years.
- Requires the agent's wallet to hold enough VIRTUAL (fee + optional pre-buy) and ETH for gas.
- Trading fees on the token route back to the **agent's own wallet** — i.e., the agent is a real economic actor, not just a mint recipient.
- Options at launch: anti-sniper window, pre-buy, "Capital Formation" mode, a 60-day reversible test mode, 0–5% veVIRTUAL airdrop, Robotics/Embodied marking.
- Token entitlement is exposure to the agent's fee/revenue stream; docs don't spell out governance rights beyond that.

## 3. Agent Commerce Protocol (ACP)

Source: https://os.virtuals.io/acp/overview , /acp/concepts

- Reference implementation of **ERC-8183** (agent-to-agent commerce standard); every transaction recorded on-chain.
- Three roles: **Client** (requests work), **Provider** (delivers), **Evaluator** (optional neutral approver; Client fills this role if none is designated).
- **Job lifecycle**: `open → budget_set → funded → submitted → completed` (or `rejected`/`expired`). Provider sets price at `budget_set`; Client funds an on-chain **escrow** at `funded`; funds (USDC) release automatically on approval at `completed`.
- Two job types: **service-only** (fee only, e.g. 0.1 USDC for image gen) and **fund-transfer** (fee + managed principal, e.g. 10 USDC fee to manage 1000 USDC in a yield strategy).
- **Fee split, enforced on-chain**: no Evaluator → Provider 95% / Protocol 5%. With Evaluator → Provider 90% / Evaluator 5% / Protocol 5%.
- Base Mainnet contracts: ACP Core `0x238E541BfefD82238730D00a2208E5497F1832E0`, FundTransferHook `0x90717828D78731313CB350D6a58b0f91668Ea702`.
- **Dev interfaces**: SDK `@virtuals-protocol/acp-node-v2` (programmatic) and CLI `@virtuals-protocol/acp-cli` (shell). Both expose shared LLM tool-calling primitives natively: `availableTools()`, `toMessages()`, `executeTool()` — this is the hook point for wiring *any* LLM backend into an agent's decision loop.

## 4. Compute / inference layer — the critical seam for this hackathon

Source: https://os.virtuals.io/agent-identity/compute/overview

- Virtuals offers its own hosted inference, **"Agent Compute"**, at `https://compute.virtuals.io/v1` (OpenAI-compatible, wallet-funded auto-top-up, ~14 models incl. Claude/GPT/DeepSeek/GLM/MiniMax — **no NVIDIA Nemotron, no Nebius**).
- **Confirmed: this is a hosted service, not a plugin architecture** — there's no first-party way to point Virtuals' own compute layer at an external GPU/inference provider (NVIDIA NIM, RunPod, Nebius, etc. are not integrable there).
- **This is exactly the opening we need.** ACP's SDK doesn't require using `compute.virtuals.io` — it just needs something that satisfies `availableTools()` / `toMessages()` / `executeTool()`. Nothing stops us from running the agent's actual reasoning loop against a **self-hosted OpenAI-compatible endpoint on Nebius AI Cloud / Token Factory serving an NVIDIA Nemotron model**, and using Virtuals purely for identity/wallet/token/ACP commerce. That split — Nebius+NVIDIA for the brain, Virtuals for the on-chain identity/economy — is what satisfies the hackathon's mandatory platform+model requirement *and* delivers the user's "tokenized agent" concept, without them being in tension.

## 5. Costs to launch a tokenized agent

- 100 VIRTUAL fixed launch fee (real cost on mainnet) + ETH for gas on Base.
- Optional pre-buy amount (discretionary, adds VIRTUAL cost).
- Graduation to permanent liquidity happens automatically at 42,000 VIRTUAL TVL — we don't need to hit this for a hackathon demo, the bonding-curve stage alone is enough to show the mechanism live.
- **Base Sepolia testnet is explicitly supported** for the token launch flow — no real-money cost, appropriate for a hackathon demo unless we want a real mainnet artifact.
- ACP job fees are USDC-denominated and small (protocol takes 5%) — trivial cost for demo jobs.

## 6. Case studies / prior art

Not deeply chased down (time-boxed); CoinGecko/Forkast/99Bitcoins/Dextools background pieces confirm the three-pillar framing (ACP + Tokenization Platform + GAME framework for multimodal agent APIs/SDKs) but none of the background pieces describe a project pairing Virtuals tokenization with NVIDIA/Nebius-hosted inference specifically — this pairing looks novel, which is good for the "Quality of Idea" judging criterion (non-obvious use of the required platforms) but means no existing template to copy; the two docs above (`acp/overview`, `agent-identity/compute/overview`) are the primary sources for the integration seam, not a worked example.

## 7. Verified build-time specifics (added 2026-09-03, for the engineering stories)

### 7.1 Nebius Token Factory — auth, models, sandboxes
- **Base URL discrepancy — unresolved, verify at build time**: docs.tokenfactory.nebius.com/quickstart
  shows `https://api.tokenfactory.nebius.com/v1/`; nebius.com/services/token-factory/nemotron shows
  `https://api.tokenfactory.us-central1.nebius.com/v1/`. Confirm the working one via a live
  `GET /v1/models` call before hardcoding either into the codebase.
- **Auth**: env var `NEBIUS_API_KEY`, header `Authorization: Bearer $NEBIUS_API_KEY`. Confirmed
  OpenAI-compatible — the standard `openai` SDK works by only changing `base_url`/`api_key`.
  (Note: `.env` in this project currently has the key stored as `nebius_api_key`, lowercase —
  needs renaming/aliasing to `NEBIUS_API_KEY` to match the SDK convention.)
- **Model list**: 5 Nemotron variants named in github.com/nebius/token-factory-cookbook —
  Nemotron-3-Nano-30B-A3B, Nemotron-3-Nano-Omni, Nemotron-3-Super-120B-A12B,
  Nemotron-3-Ultra-550B-A55B, Llama-3.1-Nemotron-Ultra-253B-v1. **Only one exact API id string is
  confirmed**: `nvidia/nemotron-3-super-120b-a12b`. The other four are unconfirmed — call
  `GET /v1/models` (documented, returns `{"object":"list","data":[{"id":...}]}`) to get the real
  strings rather than guessing the naming pattern.
- **Minimal verified example** (source: nebius.com/services/token-factory/nemotron):
  ```python
  import os
  from openai import OpenAI
  client = OpenAI(
    base_url="https://api.tokenfactory.us-central1.nebius.com/v1/",
    api_key=os.environ.get("NEBIUS_API_KEY"))
  response = client.chat.completions.create(
    model="nvidia/nemotron-3-super-120b-a12b",
    messages=[
      {"role": "system", "content": "You are helpful assistant"},
      {"role": "user", "content": [{"type": "text", "text": "Hello"}]}])
  ```
- **Token Factory Sandboxes** = same product as "Contree." **Currently Beta.** Isolated microVM
  code execution with checkpointing/branching, arbitrary OCI images (any language/runtime with a
  container image). Interfaces: Contree CLI, Contree Python SDK, Contree MCP server
  (`uv tool install contree-mcp`, or for Claude Code: `claude mcp add --transport stdio contree --
  $(which uvx) contree-mcp`). Primary call is a `contree_run`-style tool: `{"command": "...",
  "image": "tag:python:3.11"}` → output + exit code. No raw REST endpoint path/SDK method
  signature was confirmed — only the CLI/MCP surface. Pricing/billing not stated (Beta).
- **Credits**: promo code `NEBIUS-DEVPOST-GLOBAL26` = $25 Token Factory credit; Nebius Builders
  Program (dev.nebius.com/builders) = another $25 + Tavily/Academy credits (secondary-sourced,
  not confirmed on Nebius's own site). Not verified whether credit covers Sandboxes (Beta) or
  inference only.
- **Signup**: create account + payment card → console Billing section → "Apply promo code."
  Nebius's own signup-billing docs state a **$25 charge is added to your account balance** during
  signup — unclear from the docs excerpt whether this is a real charge or a card-verification
  hold. Flag for a human to confirm before assuming it's free. API-key generation location in the
  console was not confirmed by this research pass.

### 7.2 Virtuals ACP — verified CLI/SDK commands
- **Install**: CLI `npm i -g @virtuals-protocol/acp-cli`; SDK `npm install
  @virtuals-protocol/acp-node-v2` (peer deps `viem`, `@account-kit/infra`). The non-`-v2` package
  `@virtuals-protocol/acp-node` and the `openclaw-acp` repo are explicitly **deprecated** — do not
  use either.
- **Wallet creation**: `acp configure` (interactive) or scripted via `acp configure start --json`
  + `acp configure complete --request-id <id> --json`. The wallet is **Privy-managed**, not a
  self-generated keypair — the SDK's provider adapter (`PrivyAlchemyEvmProviderAdapter`) needs
  `walletAddress`, `walletId` (Privy identifier), and `signerPrivateKey` (pulled from the Agent
  Console's Signers tab after `add-signer`, not generated locally). Relevant env vars:
  `ACP_CONFIG_DIR` (default `~/.config/acp`), `IS_TESTNET=true`, `PARTNER_ID`,
  `ACP_DASHBOARD_URL`.
- **Agent registration sequence**: `acp agent create --name "..." --description "..." --image
  "..."` → `acp agent add-signer [--agent-id <id> --policy restricted]` → `acp agent use
  --agent-id <id>` → verify with `acp agent whoami`.
- **Tokenize (verified flags)**: `acp agent tokenize --chain-id 84532 --symbol AUTO` (84532 = Base
  Sepolia; 8453 = Base Mainnet). Optional: `--anti-sniper 0`, `--prebuy 100` (VIRTUAL units),
  `--acf` (Capital Formation mode), `--60-days` (reversible test-launch mode),
  `--airdrop-percent 2.5`, or `--configure` for an interactive flow.
- **ERC-8004 registration (separate step, see correction above)**: `acp agent register-erc8004
  --agent-id <id> --chain-id 84532`.
- **ACP job-flow SDK**: `JobSession` exposes `availableTools()`, `toMessages()`, `executeTool()` —
  confirmed real (github.com/Virtual-Protocol/acp-node-v2 README), triggered on an `"entry"`
  event. State-gated methods: `open` → `sendMessage()`/`setBudget()` (provider); `budget_set` →
  `fund()` (client) / `setBudget()` (provider); `funded` → `submit()` (provider); `submitted` →
  `complete()`/`reject()` (evaluator). Verified minimal pattern (swap any OpenAI-compatible client
  in place of the Anthropic example call):
  ```js
  agent.on("entry", async (session, entry) => {
    const tools = session.availableTools();
    const messages = await session.toMessages();
    const response = await llmClient.chat(...); // Nebius/Nemotron endpoint goes here
    const toolBlock = response.content.find(b => b.type === "tool_use");
    if (toolBlock) await session.executeTool(toolBlock.name, toolBlock.input);
  });
  ```
  A Provider must also list its offering at the Service Registry (app.virtuals.io/acp/new — a
  manual web step, not CLI) before it can accept jobs. A Client needs no separate registration;
  it creates jobs via `agent.createJobByOfferingName()` / `agent.createJob()`.
- **Testnet funds**: Base Sepolia ETH **and USDC** are both directly available via the CDP MCP
  server already connected in this environment — `mcp__cdp__cdp_evm_faucet`
  (`POST /v2/evm/faucet`), `{"network": "base-sepolia", "address": "<addr>", "token": "eth"|"usdc"}`
  (also supports `eurc`, `cbbtc`). This resolves the testnet-USDC funding gap flagged for Story 7.
  Public web faucets (Coinbase Developer Platform, Alchemy, thirdweb) remain a fallback. A
  dedicated testnet-VIRTUAL faucet was **not confirmed** (CDP's faucet doesn't cover VIRTUAL); the
  ACP CLI has a `topup` wallet subcommand of unconfirmed behavior — check `acp topup --help`
  directly rather than assume it dispenses free testnet VIRTUAL.
- **No official quickstart** demonstrates a tokenized Provider agent backed by a custom/external
  LLM. `github.com/Virtual-Protocol/acp-cli-demos` exists but its one full example is a paid
  subscription-checkout agent (Email/Card primitives, not tokenization or a custom LLM) plus two
  unrelated model-routing utilities. The closest real reference is the SDK's own
  `src/examples/llm/` directory — treat it as the pattern to adapt, not a ready-made starter.

## Open items / not verified

- Exact `/agent-identity/compute/models` per-token pricing table wasn't pulled (page referenced but not fetched — low priority since we're bypassing Virtuals compute entirely).
- ERC-8004 reputation mechanics (what score, how it's computed, who reads it) not documented on the pages fetched — would need `/acp/architecture` or the ERC-8004 spec itself if we want to lean on reputation as a demo feature.
- No official Virtuals+Nebius/NVIDIA partnership found — treat the integration as our own novel bridge, not a supported path with dedicated docs.
