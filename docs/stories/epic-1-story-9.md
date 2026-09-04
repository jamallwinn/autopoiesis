# Story: Repo Hygiene & Hackathon Submission Packaging

<!-- Source: B_Create_Story.md task -->
<!-- Context: Epic 1 (Autopoiesis), Story 9 of 10 — final story, makes the project actually submittable -->
<!-- Revised 2026-09-03 after Codex adversarial review, docs/reviews/codex-adversarial-review-1.md §1.2-1.4, §1.7, §1.13 -->

## Status: Draft — [ ] Not started. License/README-skeleton/eligibility-recheck can start early
(Track C, per the epic); final video/submission tasks are blocked on Story 8 completion.

## Story

As a hackathon participant,
I want the repo to meet every literal Devpost submission requirement — correctly, not
approximately,
so that the project is actually eligible to be judged, not disqualified on a technicality after
all the engineering work is done.

## Context Source

- Source documents: `PLAN.md` §2 (submission deliverables), `research/RESEARCH.md` §1
  (nebiusglobalaihackathon.devpost.com/rules), Story 0 (eligibility preflight),
  `docs/reviews/codex-adversarial-review-1.md` §1.2 (missing deployment task), §1.3 (video-length
  wording bug), §1.4 (eligibility deferred too late), §1.7 (secret-scan insufficiency), §1.13
  (README repro criterion improperly bundled account/secret creation)
- Enhancement type: packaging/compliance, no functional code changes
- Existing system impact: none — this story wraps, it does not modify, Stories 1-8's work

## Acceptance Criteria

1. A public repo (GitHub/GitLab/Bitbucket) exists with a visibly displayed OSI license file
   (MIT, Apache-2.0, or MPL-2.0).
2. **(Split — review §1.13)** The README is split into three distinct sections, not one
   undifferentiated "reproduce everything" guide: (a) **public local setup** — cloning, installing
   dependencies, running tests, safe for any reader; (b) **creating your own fresh testnet
   identity** — a reader can follow this to get their *own* independent Virtuals agent/wallet/
   token on Base Sepolia, never the project's actual identity or secrets; (c) **maintainer-only
   deployment configuration** — clearly marked as not-for-general-readers, using safe placeholders
   for every credential, never real values.
3. A written feedback section on Nebius/NVIDIA tooling is completed, based on real friction
   actually encountered during the build (e.g., Sandboxes Beta gaps, base-URL discrepancy, ACP SDK
   documentation gaps, the response-shape bug Codex found in the original Story 6 draft) — not
   generic praise, and citing the actual story where each issue was found.
4. **(Fixed — real compliance bug, review §1.3)** A public YouTube demo video, **strictly under
   3:00** (not "≤3:00" — the confirmed rule is `<3 minute`, so a video at exactly 3:00 would fail),
   with audio, is recorded and published, explicitly narrating the Nebius/NVIDIA usage first and
   the Virtuals tokenization layer second, per the off-brief risk noted in `PLAN.md` §10. Target
   2:40–2:50 to leave margin, and verify the actual published YouTube duration after upload — not
   just the local render length.
5. The Devpost submission form is fully completed under the Coding and Agentic Engineering track,
   including disclosure that `.claude/commands` templates from another project were reused to
   structure this epic/story planning (pre-existing-work disclosure rule).
6. Story 0's eligibility preflight is re-confirmed against the live Devpost rules tab one final
   time immediately before submission — this is a final gate, not the first check (that already
   happened in Story 0).
7. **(New — review §1.2)** The submitted "working demo URL" is verified reachable, functional, and
   showing the real Story 6/7/8 flow — fetched/loaded from a clean browser session on a device
   other than the dev machine, immediately before submission, since a URL that worked during
   development but broke after a redeploy would silently invalidate the submission.
8. **(Strengthened — review §1.7)** Secret-safety verification uses a real history-aware scan
   across the full repository (all refs/commits), not a plain working-tree grep — and also
   includes a manual check of the demo video and any screenshots for an accidentally-visible
   secret on screen.

## Dev Technical Guidance

### Existing System Context

Stories 1-8 produced a working, demoed system. This story packages it for submission. Per the
epic's parallel-track guidance, the license file, README skeleton, and feedback-section drafting
can and should start as soon as Story 0 is done — not wait for Story 8 to finish.

### Integration Approach

Straightforward documentation/packaging work — no new application code. The main risk (per the
Codex review) is treating deployment verification and the video-length rule as afterthoughts; both
are hard eligibility requirements, not optional polish.

### Technical Constraints

- License must be one of the three OSI licenses named in the hackathon rules: MIT, Apache-2.0, or
  MPL-2.0 — not an arbitrary license.
- Video must be public, **strictly under 3:00**, with audio, and hosted on YouTube specifically
  (per the confirmed rule in `research/RESEARCH.md` §1 — note the exact wording is `<3 minute`,
  not `≤3 minute`).
- Working demo URL is a listed hard requirement (`PLAN.md` §2) — Story 0 proves the hosting path,
  Story 8 deploys the real dashboard to it; this story's job is final verification, not first
  deployment.

### Missing Information

- None remaining from earlier passes — Story 0 resolved the eligibility-timing gap and the
  deployment-target gap that this story previously had to handle cold.

## Tasks / Subtasks

- [ ] Task 1: Add license (can start immediately after Story 0)
  - [ ] Choose MIT, Apache-2.0, or MPL-2.0 and add the license file at repo root
- [ ] Task 2: Write the three-part README (skeleton can start after Story 0; finalize after Story 8)
  - [ ] Part (a): public local setup instructions
  - [ ] Part (b): fresh independent testnet identity creation instructions (never the project's
        own identity/secrets)
  - [ ] Part (c): maintainer-only deployment config, safe placeholders only
  - [ ] Explicitly call out the naming-collision warning from `PLAN.md` §1
- [ ] Task 3: Write the tooling feedback section (can start as friction is discovered in Stories
      1-7, don't wait until the end to reconstruct it from memory)
  - [ ] Cite the actual story where each issue was found
- [ ] Task 4: Record and publish the demo video
  - [ ] Script it so Nebius/NVIDIA usage is shown/narrated first, Virtuals layer second
  - [ ] Target 2:40–2:50; verify the actual published YouTube duration is strictly under 3:00
- [ ] Task 5: Verify the deployed demo URL immediately before submission
  - [ ] Load it from a clean browser session on a non-dev-machine device
  - [ ] Run through the real flow once; paste real confirmation it works
- [ ] Task 6: Submit to Devpost
  - [ ] Select Coding and Agentic Engineering track
  - [ ] Complete all required fields including the pre-existing-work disclosure
- [ ] Task 7: Final eligibility re-check (Story 0's preflight, re-run as a final gate)
  - [ ] Re-read the live Devpost rules tab; confirm nothing changed since Story 0
- [ ] Task 8: History-aware secret scan
  - [ ] Run a scan across full git history (all refs), not just the working tree
  - [ ] Manually review the demo video and any published screenshots for visible secrets

## Risk Assessment

### Implementation Risks

- **Primary Risk:** A missed literal submission requirement (license visibility, video length/
  platform, a broken demo URL, disclosure) could make an otherwise-strong project ineligible.
- **Mitigation:** Task 5's clean-device demo-URL check and Task 7's final rules re-check both
  happen immediately before submission, not earlier in the build when things could still change.
- **Verification:** Each acceptance criterion above is checked against the actual live submission
  page/form/URL, not against this story's own description of the rules.

### Rollback Plan

- N/A — packaging work; if something is wrong, it's corrected and resubmitted before the actual
  deadline (Oct 30, 2026, 10am PT per confirmed research).

### Safety Checks

- [ ] Full-history secret scan (Task 8) confirms nothing sensitive was ever published, in the
      working tree or in any prior commit
- [ ] Demo video and screenshots manually reviewed for accidentally-visible secrets
- [ ] README Part (b) never contains the project's own real signer key/wallet — only guides a
      reader to create their own

## Success Criteria

1. Public repo, license, and three-part README all exist and are verifiable by visiting the actual
   repo URL.
2. Demo video is published, confirmed strictly under 3:00 as actually shown on YouTube, and its
   URL is pasted in this story's Verification section.
3. The public demo URL is confirmed working from a clean, non-dev-machine browser session
   immediately before submission.
4. Devpost submission is confirmed complete (screenshot or confirmation page reference).
5. Full-history secret scan and manual video/screenshot review both confirm nothing sensitive was
   published.

## Verification (fill in when the work is actually done — do not pre-fill or fabricate)

```
$ <paste the actual command run, e.g. the full-history secret scan>
<paste the actual output>
Repo URL: <paste>
Video URL: <paste, with confirmed duration>
Deployed demo URL clean-device check: <paste>
Devpost submission confirmation: <paste>
```

Status after verification: **[ ] Not yet verified**
