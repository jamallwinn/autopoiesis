# Story: Preflight — Eligibility Gate, Shared Contract, and Deployment Target

<!-- Source: B_Create_Story.md task -->
<!-- Context: Epic 1 (Autopoiesis), Story 0 of 10 — added after Codex adversarial review, 2026-09-03 -->
<!-- Added because: Codex's review found the plan only checked eligibility rules and only
     designed the dashboard's event contract AFTER most of the build, and found that Stories 2, 3,
     and 6 each independently invented a tool/execution schema that was never confirmed to agree
     with the others. This story front-loads both, per the review's Top-5 fixes #2, #3, #5. -->

## Status: Draft — [ ] Not started. Do this first, before Story 1.

## Story

As the engineer building Autopoiesis,
I want to (a) confirm the project is actually eligible to be submitted before investing build time,
(b) define one canonical, versioned data contract that Stories 2, 3, 6, and 8 all implement
against instead of each inventing their own shapes, and (c) decide where the public demo will be
deployed,
so that eligibility surprises, interface-mismatch bugs at integration time, and a scramble to
stand up a public URL at the end are all prevented rather than discovered late.

## Context Source

- Source: Codex adversarial review, 2026-09-03 (see `docs/reviews/codex-adversarial-review-1.md`),
  items §1.2 (no deployment/demo-URL task anywhere), §1.4 (eligibility deferred past irreversible
  decisions), §3.1–3.3 (Stories 2/3/6 schemas never reconciled), §2.11 (dashboard observability
  designed too late), Top-5 fixes #2, #3, #5.
- Enhancement type: new story, inserted before Story 1 in build order
- Existing system impact: none yet — this is the first story in the epic

## Acceptance Criteria

1. A written eligibility/compliance checklist is completed against the **live** Devpost rules
   page (not from memory of earlier research): team-size cap, geographic exclusions, allowed
   prior-work disclosure rules, judging-access requirements, submission ownership rules. Any item
   that would block or complicate this specific build (solo, using `.claude/commands` templates
   from another project, using Nebius+Virtuals+CDP together) is flagged explicitly.
2. A single versioned contract document exists (this story's primary deliverable) defining, with
   concrete field-level schemas, all of:
   - `ToolInvocation` — the normalized shape any LLM response (OpenAI/Nemotron tool-calling or a
     structured-output fallback) gets converted into before dispatch, decoupled from any one
     provider's raw response shape.
   - A tool-namespace split: **ACP/session tools** (what `session.availableTools()` exposes to
     the protocol layer) vs. **coding/sandbox tools** (`write_file`, `run_command`/`run_tests`)
     that Story 2's reasoning loop actually calls — plus the dispatcher contract that routes
     between them.
   - `write_file({relativePath, content, encoding, expectedPreviousHash?})` → `{path,
     bytesWritten, sha256}` or a typed error — with path-traversal/absolute-path rejection and a
     size/count cap.
   - `run_command({argv, cwd, timeoutMs, envAllowlist})` → `{status, exitCode, signal, timedOut,
     stdout, stderr, durationMs, truncated}`; `run_tests` extends this with parsed
     discovered/passed/failed counts and an artifact digest.
   - `VerificationResult` — the explicit submission gate: exit code 0, ≥1 discovered test, zero
     failures, no timeout, no policy violation, artifact digest matches what's delivered.
   - `SandboxAdapter` interface — `create/run/write/read/collect/terminate`, session identity,
     workspace semantics, supported images, resource limits, cleanup guarantee — this is what
     Story 3's Contree exploration must conform to (or explicitly document deviation from).
   - Dashboard event types — one canonical, versioned event schema (model-call started/finished,
     tool-request, tool-result, sandbox-lifecycle, test-summary, ACP-state-transition,
     tx-confirmation, balance-refresh), each carrying a canonical cross-system **job correlation
     ID** that ties together the ACP job/session ID, the sandbox session ID, and any model request
     IDs — this is what Stories 2, 3, 6, and 8 must all emit/consume, so the dashboard never shows
     one job's sandbox output next to another job's ACP state.
3. A deployment target for the public demo is decided and a minimal "hello world" version is
   actually deployed and reachable over HTTPS from a machine other than the dev machine — proving
   the hosting path works before Story 8 needs to deploy the real dashboard on a deadline.
4. The contract document is saved at a stable path (`docs/architecture/shared-contract.md`) that
   Stories 2, 3, 6, and 8 explicitly reference rather than re-deriving their own schemas.

## Dev Technical Guidance

### Existing System Context

Nothing built yet. This story produces no application functionality — it produces the eligibility
answer, the contract document, and a deployed "hello world."

### Integration Approach

This is intentionally a planning + thin-infra story, not a feature story. The "hello world" deploy
should be the smallest possible thing that proves the chosen hosting path (e.g., a static page or
a one-route API) — not a placeholder for the real dashboard's design.

### Technical Constraints

- The contract must be provider-agnostic at the `ToolInvocation` level — Codex's review found
  Story 6's original draft assumed an Anthropic-shaped response (`response.content` search for a
  `"tool_use"` block) while Story 2 uses an OpenAI-compatible client; this contract is what
  prevents that mismatch from recurring.

### Missing Information

- Exact hosting target (Vercel/Netlify/a Nebius-hosted option/other) is an open choice — Task 3
  below is where it gets decided, weighing "reachable public HTTPS URL" as the only hard
  requirement from the hackathon rules.

## Tasks / Subtasks

- [x] Task 1: Eligibility/compliance preflight — DONE 2026-09-03, see Verification below
  - [x] Re-read the live Devpost rules tab today; record team-size cap, geographic exclusions,
        prior-work disclosure requirements, judging-access requirements verbatim
  - [x] Explicitly confirm this build (solo, reusing `.claude/commands` templates, using
        Nebius+Virtuals+CDP) has no disclosed conflict with those rules — confirmed, see
        Verification (two items flagged for the human to self-certify, not verifiable by me)
- [x] Task 2: Write the shared contract document — DONE 2026-09-03
  - [x] Draft `docs/architecture/shared-contract.md` covering every schema listed in Acceptance
        Criterion 2 (`ToolInvocation`/`ToolResult`, namespace+dispatcher, `write_file`,
        `run_command`/`run_tests`, `SandboxAdapter`, `VerificationResult`, dashboard events, job
        correlation ID)
  - [x] Versioned as `v0.1`, with an amendment log for future story-driven revisions
- [ ] Task 3: Decide and prove the deployment target
  - [ ] Choose a hosting target for the public demo
  - [ ] Deploy a minimal "hello world" (static page or one API route)
  - [ ] Fetch it from a network/device other than the dev machine; paste real proof (URL + curl
        or screenshot from another device)
- [ ] Task 4: Cross-reference
  - [ ] Add a "See `docs/architecture/shared-contract.md`" pointer into Stories 2, 3, 6, and 8's
        Dev Technical Guidance sections (already done as part of this Codex-review update pass —
        confirm the pointers are present)

## Risk Assessment

### Implementation Risks

- **Primary Risk:** Spending a full story on contract-writing before any working code exists could
  itself become a time sink or produce a contract that turns out wrong once real APIs are touched.
- **Mitigation:** Treat the contract as versioned and revisable — Stories 2/3/6/8 are expected to
  propose amendments back into `shared-contract.md` if reality disagrees, not silently diverge
  from it. Keep Task 2 time-boxed; a "good enough v0.1" beats a perfect contract that delays
  Story 1.

### Rollback Plan

- N/A — planning artifacts and a throwaway "hello world" deploy; nothing to roll back.

### Safety Checks

- [ ] No secrets involved in the "hello world" deploy (no real API keys wired in yet)

## Success Criteria

1. Eligibility checklist completed against the live rules page, with any conflicts flagged.
2. `docs/architecture/shared-contract.md` exists, versioned, covering all schemas in AC 2.
3. A real, working public HTTPS URL is proven reachable from off the dev machine.
4. Stories 2, 3, 6, 8 reference this contract explicitly (verified by grep for the file name across
   those story files).

## Verification (fill in when the work is actually done — do not pre-fill or fabricate)

### Task 1 — Eligibility preflight, real findings (fetched 2026-09-03 from
https://nebiusglobalaihackathon.devpost.com/rules)

- **Team size:** No explicit cap is stated anywhere in the rules. Not a blocker for solo build.
- **Geographic exclusions (verbatim categories from the rules):** residents of Brazil, Quebec,
  Russia, Crimea, Cuba, Iran, North Korea, or any other country comprehensively sanctioned by the
  U.S. Treasury's OFAC. **I cannot verify the human operator's residency — this must be
  self-confirmed by you before submission. Flagging, not assuming.**
- **Pre-existing code/tools rule (verbatim):** project must be "either newly created by the
  Entrant... or, if the Entrant's Project existed prior to the Hackathon Submission Period, must
  have been significantly updated after the start of the Hackathon Submission Period" (submission
  period started Aug 26, 2026). This project (Autopoiesis) was created from scratch on 2026-09-03,
  entirely within the submission period — **no conflict.** The `.claude/commands` files
  (`B_Create_Epic.md`, `B_Create_Story.md`, etc.) copied in from another local project are
  planning-process templates used to structure this repo's docs, not part of the submitted
  product/application code itself — Story 9's disclosure task still discloses this in the Devpost
  form per the rule's spirit, even though it's arguably not "the Project."
- **Third-party SDK/tool authorization (verbatim):** "Entrant must be authorized to use them in
  accordance with any terms and conditions or licensing requirements of the tool." Nebius Token
  Factory, Virtuals ACP SDK/CLI, and CDP MCP are all used via their own public developer programs
  with accounts/API keys obtained directly by this build — no conflict identified.
- **License requirement (verbatim):** an OSI license (Apache-2.0, MIT, or MPL-2.0), "detectable and
  visible at the top of the repository page." Matches the plan already in Story 9 — no change
  needed.
- **Video length (verbatim, RE-CONFIRMS the earlier correction):** "should be less than three (3)
  minutes. Judges are not required to watch beyond three minutes." Confirms Story 9's `<3:00`
  fix (not `≤3:00`) was correct.
- **Submission ownership (verbatim):** must be "solely owned by you, your Team, your Organization
  with no other person or entity having any right or interest in it." Fine for a solo build using
  accounts the operator controls directly.
- **Judging access (verbatim):** must "provide a link to a website, functioning demo, or a test
  build"; if private, "must include login credentials in its testing instructions." **Decision:**
  Story 8's dashboard will be kept public with no login required, to avoid this extra friction
  entirely and to keep the "zero friction" UX goal intact.
- **Age requirement:** "at least the age of majority where they reside." Cannot be verified by
  me — self-certify.
- **Employment restriction (verbatim):** employees/agents of Promotion Entities, Judges, and their
  immediate family/household are ineligible. Cannot be verified by me — self-certify.

**Net result:** No disclosed conflict found for anything I can actually check. Two items
(residency, employment/family relation to organizers or judges) require your own self-certification
before final submission — I'm flagging them honestly rather than assuming a clean answer on your
behalf. Deadline reconfirmed: **October 30, 2026, 10:00 AM PDT.**

### Task 2 and Task 3 verification — pending, see below once completed

```
$ <paste the actual command run>
<paste the actual output, including the deployed URL and an external fetch/curl result>
```

Status after verification: **[ ] Not yet verified**
