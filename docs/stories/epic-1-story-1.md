# Story: Nebius Token Factory Account, API Key & Model Discovery

<!-- Source: B_Create_Story.md task, using research/RESEARCH.md §7.1 as technical source -->
<!-- Context: Epic 1 (Autopoiesis), Story 1 of 10, Track A — blocked only on Story 0 (preflight) -->
<!-- Note added 2026-09-03 after Codex adversarial review: eligibility checking moved to Story 0
     and now happens before this story, not deferred to final submission. No other change to this
     story's content was required by the review. -->

## Status: Draft — [ ] Not started (blocked on Story 0)

## Story

As the engineer building Autopoiesis,
I want a working Nebius Token Factory account, a correctly-named API key, and the real confirmed
model ID strings for the available Nemotron variants,
so that every later story can call the inference API with confidence instead of guessing at an
endpoint or model name that might not exist.

## Context Source

- Source documents: `PLAN.md` (build plan §7, stage 1), `research/RESEARCH.md` §7.1
- Enhancement type: greenfield setup — first story in the epic, nothing to protect yet
- Existing system impact: none; `.env` currently holds `nebius_api_key` (lowercase), which this
  story must reconcile with the `NEBIUS_API_KEY` convention the OpenAI-compatible SDK expects

## Acceptance Criteria

1. `GET /v1/models` succeeds against a confirmed-working base URL and returns a JSON list
   containing at least one `nvidia/nemotron-*` model id.
2. The base-URL discrepancy noted in `research/RESEARCH.md` §7.1 (`api.tokenfactory.nebius.com`
   vs `api.tokenfactory.us-central1.nebius.com`) is resolved by live test, not assumption, and the
   resolution is recorded.
3. `NEBIUS_API_KEY` is available to the process environment (via `.env` + a loader, or an alias),
   and `.env` is confirmed present in `.gitignore` so the key is never committed.
4. A minimal chat-completion call against a confirmed real Nemotron model id returns a valid
   response (HTTP 200, non-empty `choices`), with no auth or model-not-found error.
5. `research/RESEARCH.md` §7.1 is updated to replace "unconfirmed" model id strings with the real
   ones actually returned by `/v1/models`.

## Dev Technical Guidance

### Existing System Context

Nothing exists yet except `.env` (holding `nebius_api_key`) and the planning docs. This story
produces the first real, tested artifact.

### Integration Approach

Direct HTTP/SDK calls to Nebius Token Factory's OpenAI-compatible API. No sandbox, no chain
involvement in this story — keep it isolated so failures here can't be confused with failures in
later, more complex stories.

### Technical Constraints

- Confirmed pattern (verbatim from `research/RESEARCH.md` §7.1, source: nebius.com/services/
  token-factory/nemotron):
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
- Models list endpoint (confirmed shape, source: docs.tokenfactory.nebius.com/api-reference/
  models/list-models): `GET https://api.tokenfactory.nebius.com/v1/models` with
  `Authorization: Bearer $NEBIUS_API_KEY` → `{"object":"list","data":[{"id":...,"owned_by":...}]}`.
- Only `nvidia/nemotron-3-super-120b-a12b` is a confirmed exact id going in; the other four
  Nemotron variants (Nano-30B-A3B, Nano-Omni, Ultra-550B-A55B, and Llama-3.1-Nemotron-Ultra-253B)
  are named but their exact `model=` strings are not — get them from the real `/v1/models`
  response, don't guess the naming pattern.

### Missing Information

- Which of the two base URLs is actually canonical is unknown until tested live — this story's
  Task 1 resolves it.
- Exact console location to generate an API key was not found in research — Task 2 below is an
  exploration task for this.
- Whether the $25 signup charge mentioned in Nebius's billing docs is a real charge or a
  card-verification hold is unconfirmed — note it in the story but do not block on it (the
  hackathon promo code should cover Token Factory usage regardless).

## Tasks / Subtasks

- [ ] Task 1: Resolve the base-URL discrepancy
  - [ ] Call `GET /v1/models` against `https://api.tokenfactory.nebius.com/v1/models` with the
        real key; record status code and response
  - [ ] Call the same against `https://api.tokenfactory.us-central1.nebius.com/v1/models`;
        record status code and response
  - [ ] Record which one is canonical (or if both work) in `research/RESEARCH.md` §7.1
- [ ] Task 2: Reconcile the API key
  - [ ] Confirm whether `nebius_api_key` in `.env` is a live, valid key by using it in Task 1
  - [ ] Add `NEBIUS_API_KEY` to `.env` (alias or rename) so it matches SDK convention
  - [ ] Confirm `.env` is listed in `.gitignore` (create `.gitignore` if it doesn't exist)
  - [ ] If the console API-key-generation UI needs to be visited to confirm/rotate the key,
        document the actual steps found (exploration — not confirmed by research)
- [ ] Task 3: Enumerate real Nemotron model ids
  - [ ] Parse the `/v1/models` response for every id containing `nemotron`
  - [ ] Paste the full real list into this story's Verification section below
  - [ ] Update `research/RESEARCH.md` §7.1 replacing "unconfirmed" with the real strings
- [ ] Task 4: Confirm hackathon credit is applied
  - [ ] Check console billing balance reflects the `NEBIUS-DEVPOST-GLOBAL26` promo credit (or
        apply it if not yet applied)
- [ ] Task 5: Minimal smoke test
  - [ ] Run the verified Python (or equivalent Node) snippet above against a real confirmed model
        id from Task 3
  - [ ] Paste the actual response (or a representative excerpt) into Verification below

## Risk Assessment

### Implementation Risks

- **Primary Risk:** Neither candidate base URL works with the current key (e.g., key not yet
  activated, or region-specific routing issue), blocking every downstream story.
- **Mitigation:** Task 1 tests both URLs explicitly before any other story begins; if neither
  works, this story is not marked complete and the epic pauses here rather than building on an
  unconfirmed foundation.
- **Verification:** The actual HTTP status codes and response bodies from both URL attempts are
  pasted into this file, not summarized.

### Rollback Plan

- N/A — no existing system to roll back to. If the key/account setup is wrong, the fix is
  correcting `.env` and re-running Task 1-5; no destructive action is taken.

### Safety Checks

- [ ] `.env` confirmed in `.gitignore` before any commit touching this repo
- [ ] No API key value ever pasted into this story file or any committed file — only confirmation
      that it works, never the key itself

## Success Criteria

This story is done only when all of the following are true, each with terminal output pasted as
proof in the Verification section below (not just described):

1. A real `/v1/models` call succeeds and its output is pasted below.
2. The canonical base URL is stated explicitly, with the evidence for why.
3. A real chat-completion call against a real Nemotron model id succeeds and its output (or a
   representative excerpt) is pasted below.
4. `.gitignore` exists and includes `.env`, confirmed via `git check-ignore -v .env` or equivalent.
5. `research/RESEARCH.md` §7.1 no longer says "unconfirmed" for the model id list.

## Verification (fill in when the work is actually done — do not pre-fill or fabricate)

```
$ <paste the actual command run>
<paste the actual output>
```

Status after verification: **[ ] Not yet verified** — flip to `[x]` in the Status line above only
once every command above has been run for real and its real output is pasted here.
