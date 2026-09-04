# Create PRP — Edge Compute

## Feature file: $ARGUMENTS

Generate a complete PRP (Product Requirement Prompt) for implementing a feature in **this** repo — the
edge-AI verified-compute marketplace. Read the feature file first. The goal is **one-pass implementation
success**: the implementing agent gets only the PRP you write plus the codebase, so your research
findings must be *in* the PRP, not merely remembered.

> ⚠️ **This repo is not a generic project.** It moves real money on five payment rails and its entire
> value is that a machine cannot lie and get paid. A PRP that ignores §"Non-negotiables" below will
> produce code that passes every gate and silently earns zero. Read `AGENTS.md` and `CLAUDE.md`'s
> *"recurring failure mode"* section before writing.

---

## 1. Research process

### 1.1 Read the ground truth first, in this order
- `RESUME.md` — cold-start state + the live plan (**source of truth**)
- `CLAUDE.md` — conventions, per-round hard-won facts, the recurring failure mode
- `AGENTS.md` (root) + `packages/{coordinator,node-client,shared,agent-sdk}/AGENTS.md` — per-package traps
- The relevant `docs/stories/*.md` and `docs/evidence/*` for anything adjacent
- ⚠️ **Do NOT restate the version or test counts** — they are generated into fenced blocks by
  `scripts/doc-truth.mjs`. Hand-typed numbers fail `pnpm test` (R39).

### 1.2 Codebase analysis
- Find the closest existing pattern and name the files. Most features here are a *generalization* of
  something already live (e.g. the async job engine already exists as `/finetune/*`).
- **Grep for CALLERS, not definitions.** R38's rule: a feature whose only caller is a test is dead code,
  and this repo has shipped that exact bug more than once.
- Identify the money path the change touches: buyer → node → coordinator → chain.
- Note the test patterns that will pin it (`packages/*/test/*.test.ts`).

### 1.3 External research
- Cite **primary sources** — EIP pages, contract repos, official docs, on-chain reads. Include URLs and
  the observed date.
- ⚠️ **Read the contract, not the blog** (R28/R29 precedent). Anything about a chain must be verified by
  an actual `eth_call` / indexer read, or explicitly labelled UNVERIFIED.
- Record version-sensitive facts with the exact version measured (`@x402/*`, viem, Ollama engine).

### 1.4 Clarify with the user only if a wrong guess would change the design
State assumptions visibly instead of asking about things you can measure.

---

## 2. Non-negotiables every PRP must encode

1. **Differential proof or it is not done.** Every claim needs a BEFORE → AFTER measurement on real
   output. A green exit code is not evidence. Where a guard is added, prove it **fires** (mutation:
   remove the guard → its test must go red → restore the file byte-identically).
2. **Both directions.** A positive result alone proves nothing. Pair every success case with its
   negative twin — the tampered/lying/refused case (the R44/R45/R53 pattern).
3. **Never a silent zero.** If the feature can fail, it must fail *loudly and by name*. Enumerate the
   failure states and say which are FATAL, which DEGRADE with a warning, and which are a legitimate
   **third state** (`pending` / `inconclusive` / `unbindable` / `audit debt`) that must never be
   mistaken for fraud or written off.
4. **A guard that is never invoked is not a guard.** The PRP must name the caller and include a test
   that fails if the wiring is removed.
5. **Presence ≠ correctness.** Never check that a file/flag/proof *exists*; check that it *works*.
6. **Observable from outside the box.** A money-path control must be assertable via `/posture`,
   `/earnings`, `doctor`, or the canary before it is enabled.
7. **Exhaustive unions.** New rails/verdicts/job types use `never`-checked switches with no `default:`,
   so an undeclared case does not compile.
8. **Anti-drift.** Facts duplicated across packages that cannot share code get a frozen golden vector
   asserted by both suites.
9. **Publishing rules (R33b).** No doc, no `.md`, no IP, no coordinator source ever ships. Allowlist ∩
   git index, plus an independent content veto on the staged bytes.
10. **Secrets.** Never read, print, or commit `.env`, keys, or `docs/CREDENTIALS.md` values.

---

## 3. PRP structure

Use `PRPs/templates/prp_base.md` as the base, and include:

### Critical context to pass through
- **Documentation** — URLs with the specific section and observed date
- **Code examples** — real snippets from *this* codebase with `file_path:line` references
- **Gotchas** — the measured traps (facilitator quirks, engine version parity, launchd/systemd
  behaviour, RPC log-range caps, frozen-snapshot vs getter bugs)
- **Patterns** — the existing approach this must mirror

### Implementation blueprint
- Pseudocode first, then the ordered task list
- Reference real files for every pattern
- **Error-handling strategy stated per failure state** (§2.3)
- Tasks in the order they must be completed, each with its own differential proof

### Validation gates (must be executable)
```bash
# THE gate — build · typecheck · lint · shellcheck · every suite · doc regeneration
bash scripts/gates.sh                     # must be EXIT=0

# If install.sh / cli.ts / doctor.ts changed — MANDATORY:
bash scripts/linux-install-test.sh
MODE=pipe bash scripts/linux-install-test.sh
bash scripts/linux-persistence-test.sh
bash scripts/macos-install-test.sh
EDGE_LOCAL_BUNDLE=1 bash scripts/macos-install-test.sh

# If anything published changed — the ONLY test that proves the public URL:
bash scripts/real-url-install-test.sh

# If the trust/verification path changed:
bash scripts/tier1-sampling-drill.sh      # honest / lying / no-peer

# If the coordinator changed:
node scripts/coord-canary.mjs             # a green /posture proves flags, not payment
```

### Evidence
Name the file the run will produce: `docs/evidence/<round-or-feature>.md`, holding the real
terminal/on-chain output for every BEFORE/AFTER pair.

---

## 4. Output

Save as `PRPs/{feature-name}.md`.

Then score the PRP **1–10** for one-pass implementation confidence, and state what would raise it.

## 5. Quality checklist

- [ ] Ground truth read (`RESUME.md` → `CLAUDE.md` → relevant `AGENTS.md`)
- [ ] Closest existing pattern named with file paths
- [ ] Every external fact has a primary source + observed date, or is labelled UNVERIFIED
- [ ] Every task has a BEFORE → AFTER differential
- [ ] Every success case is paired with its negative twin
- [ ] Failure states enumerated: FATAL / DEGRADE / legitimate third state
- [ ] Every new guard names its caller and has a wiring test
- [ ] New unions are exhaustive (`never`, no `default:`)
- [ ] Validation gates are executable as written
- [ ] No hand-typed version or test counts (`doc-truth.mjs` owns them)
- [ ] Publishing/leak rules respected if anything ships
- [ ] Evidence file named

**Remember:** the failure mode of this codebase is *the money path broke and every surface reported
success.* Write the PRP that makes that impossible.
