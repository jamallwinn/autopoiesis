# Autopoiesis — Shared Cross-System Contract

Version: **v0.1** (2026-09-03). Produced by Story 0, Task 2.

This is the single source of truth for every data shape that crosses a boundary between the
reasoning loop (Story 2), the sandbox execution layer (Story 3), the ACP Provider integration
(Story 6), and the dashboard (Story 8). No story may invent a competing shape for anything defined
here — if reality disagrees with this document once real APIs are touched, the story that finds
the disagreement amends this file (bump the version) rather than silently diverging from it.

This document exists because Codex's adversarial review (`docs/reviews/codex-adversarial-review-1.md`
§3.1–§3.3, §4.5–§4.6, §2.7, §2.11) found that the original plan let Stories 2, 3, and 6 each
independently assume a schema, and specifically found one real bug: Story 6's original draft
assumed an Anthropic-shaped `response.content` array while Story 2 uses an OpenAI-compatible
client. This contract is what prevents that class of bug.

All types below are written as TypeScript, since Story 2's language decision (Node/TypeScript, to
avoid a cross-language boundary with the JS/TS-only ACP SDK) makes TypeScript the natural contract
language for this whole project.

---

## 1. `ToolInvocation` — the normalized tool-call shape

Every LLM response, regardless of provider or exact wire shape, is converted into this array
before anything downstream (the dispatcher, ACP, the dashboard) touches it. Story 2 owns the
normalizer that produces this from the raw Nebius/Nemotron response; Story 6 must NEVER parse a
raw provider response directly — only ever consume `ToolInvocation[]`.

```typescript
interface ToolInvocation {
  /** Unique per invocation, stable across retries of the same logical call. */
  id: string;
  /** The tool name being invoked — namespaced per §2 below, e.g. "coding.write_file". */
  name: string;
  /** Parsed arguments object (already JSON-parsed, not a raw string). */
  arguments: Record<string, unknown>;
  /** Which mode produced this: native OpenAI-style tool_calls, or the JSON fallback (see Story 2 AC 1). */
  source: "native" | "fallback";
}

interface ToolResult {
  /** Must match the ToolInvocation.id it answers. */
  invocationId: string;
  ok: boolean;
  /** Present when ok === true. */
  result?: Record<string, unknown>;
  /** Present when ok === false. Always a typed, non-throwing error — never an uncaught exception. */
  error?: { code: string; message: string };
}
```

**Normalizer contract:** `normalizeToolCalls(rawResponse: unknown): ToolInvocation[]`. Story 2's
Task 2 implements this, unit-tested against a real captured Nebius/Nemotron response — not a
hand-written guess. If native OpenAI-style `tool_calls` isn't actually supported by the model
(unconfirmed until Story 2 Task 3 tests it live), the fallback JSON-in-text mode still normalizes
into this exact same `ToolInvocation` shape, so nothing downstream needs to know which mode
produced it.

## 2. Tool namespace split and dispatcher

Two distinct namespaces exist, and one dispatcher routes between them (Codex review §3.1):

- **`acp.*`** — whatever `session.availableTools()` exposes at the ACP protocol layer (job
  metadata, messaging, budget negotiation — exact set confirmed in Story 6 against the live SDK).
- **`coding.*`** — the actual coding-agent capabilities: `coding.write_file`, `coding.run_command`,
  `coding.run_tests` (Story 3's `SandboxAdapter`-backed implementations).

```typescript
type ToolNamespace = "acp" | "coding";

function namespaceOf(toolName: string): ToolNamespace {
  const [ns] = toolName.split(".");
  if (ns !== "acp" && ns !== "coding") throw new Error(`Unknown tool namespace: ${ns}`);
  return ns;
}

interface ToolDispatcher {
  dispatch(invocation: ToolInvocation): Promise<ToolResult>;
}
```

The dispatcher is a single function that inspects `namespaceOf(invocation.name)` and routes to
either the ACP session's own tool handling or Story 3's `SandboxAdapter`-backed coding-tool
handlers. Story 6's Task 2 integration test proves every real tool name in use resolves to the
correct handler.

## 3. `write_file` — Story 3's file-write tool

```typescript
interface WriteFileArgs {
  /** Relative to the sandbox workspace root. Absolute paths and ".." traversal are rejected. */
  relativePath: string;
  content: string;
  encoding: "utf8" | "base64";
  /** Optional optimistic-concurrency check: reject the write if the file's current hash doesn't match. */
  expectedPreviousHash?: string;
}

interface WriteFileResult {
  path: string;
  bytesWritten: number;
  sha256: string;
}

type WriteFileError =
  | { code: "PATH_TRAVERSAL"; message: string }
  | { code: "ABSOLUTE_PATH_REJECTED"; message: string }
  | { code: "SIZE_LIMIT_EXCEEDED"; message: string }
  | { code: "FILE_COUNT_LIMIT_EXCEEDED"; message: string }
  | { code: "HASH_MISMATCH"; message: string };
```

Rejection rules (tested for real in Story 3 Task 2): any `relativePath` starting with `/` is
rejected as `ABSOLUTE_PATH_REJECTED`; any path containing a `..` segment after normalization is
rejected as `PATH_TRAVERSAL`; a per-file size cap and a per-session file-count cap are both
enforced server-side (exact numbers set in Story 3, not yet decided — this is a v0.1 gap Story 3
fills in and reports back here if the caps need to change).

## 4. `run_command` / `run_tests` — Story 3's execution tools

```typescript
interface RunCommandArgs {
  argv: string[];
  cwd: string;
  timeoutMs: number;
  /** Explicit allowlist of env var names passed through — nothing else reaches the process. */
  envAllowlist: string[];
}

interface RunCommandResult {
  status: "ok" | "error";
  exitCode: number | null;
  signal: string | null;
  timedOut: boolean;
  stdout: string;
  stderr: string;
  durationMs: number;
  /** True if stdout/stderr were cut off at the output-size cap. */
  truncated: boolean;
}

/** run_tests extends RunCommandResult with parsed test-outcome data. */
interface RunTestsResult extends RunCommandResult {
  discoveredTests: number;
  passedTests: number;
  failedTests: number;
  /** sha256 of the exact artifact/output this run verified — used by VerificationResult below. */
  artifactDigest: string;
}
```

`exitCode` alone is never sufficient to distinguish success from timeout from "no tests found" —
callers must check `timedOut` and `discoveredTests` explicitly (Codex review §4.6).

## 5. `SandboxAdapter` — Story 3's Contree-backed interface

```typescript
interface SandboxSession {
  sessionId: string;
  workspaceRoot: string;
}

interface SandboxAdapter {
  create(image: string): Promise<SandboxSession>;
  writeFile(session: SandboxSession, args: WriteFileArgs): Promise<WriteFileResult | WriteFileError>;
  runCommand(session: SandboxSession, args: RunCommandArgs): Promise<RunCommandResult>;
  runTests(session: SandboxSession, args: RunCommandArgs): Promise<RunTestsResult>;
  readFile(session: SandboxSession, relativePath: string): Promise<string>;
  /** Collects the full workspace as an artifact bundle (for the dashboard's Deliverable view). */
  collect(session: SandboxSession): Promise<{ files: Array<{ path: string; content: string }> }>;
  terminate(session: SandboxSession): Promise<void>;
}
```

Story 3's Task 1 exploration determines the real Contree-backed implementation of this interface
(MCP or CLI-shelled) and reports back here if Contree's real capabilities force a deviation from
this v0.1 shape — in which case this file is amended, not silently ignored.

## 6. `VerificationResult` — the ACP submission gate

This is what Story 6's `submit()` call is gated on (Codex review §3.4) — never a bare "the command
didn't crash."

```typescript
interface VerificationResult {
  passed: boolean;
  command: string[];
  exitCode: number | null;
  timedOut: boolean;
  discoveredTests: number;
  passedTests: number;
  failedTests: number;
  artifactDigest: string;
  policyViolations: string[]; // empty array if none
}

function gatesSubmission(v: VerificationResult): boolean {
  return (
    v.exitCode === 0 &&
    !v.timedOut &&
    v.discoveredTests >= 1 &&
    v.failedTests === 0 &&
    v.policyViolations.length === 0
  );
}
```

A job is submitted only when `gatesSubmission(result) === true`, and the submitted deliverable's
digest must equal `result.artifactDigest` — the exact thing that was verified is the exact thing
that gets delivered, never a later, unverified edit.

## 7. Dashboard event contract

One versioned, append-only event stream per job, each event carrying the job correlation ID
(§8). This is what Story 6 emits and Story 8 consumes (Codex review §2.6, §2.7, §2.11).

```typescript
type DashboardEvent =
  | { type: "model_call.started"; jobId: string; seq: number; ts: string; model: string }
  | { type: "model_call.finished"; jobId: string; seq: number; ts: string; model: string; durationMs: number }
  | { type: "tool.requested"; jobId: string; seq: number; ts: string; invocation: ToolInvocation }
  | { type: "tool.result"; jobId: string; seq: number; ts: string; result: ToolResult }
  | { type: "sandbox.created"; jobId: string; seq: number; ts: string; sessionId: string }
  | { type: "sandbox.terminated"; jobId: string; seq: number; ts: string; sessionId: string }
  | { type: "test_summary"; jobId: string; seq: number; ts: string; result: RunTestsResult }
  | { type: "acp.state"; jobId: string; seq: number; ts: string; state: AcpJobState }
  | { type: "tx.confirmation"; jobId: string; seq: number; ts: string; txHash: string; kind: "fund" | "settlement" }
  | { type: "balance.refresh"; jobId: string; seq: number; ts: string; walletBalance: string; token: TokenSummary };

type AcpJobState = "open" | "budget_set" | "funded" | "submitted" | "completed" | "rejected" | "expired";

interface TokenSummary {
  symbol: "AUTO";
  testPrice: string;
  curveProgressPct: number;
}
```

`seq` is a monotonically increasing per-job sequence number — the dashboard uses it to detect gaps
on reconnect and request replay from the last seen `seq` (Codex review §2.6).

## 8. Job correlation ID

```typescript
interface JobCorrelation {
  /** The application-level canonical ID, generated when the job is first created. */
  jobId: string;
  acpJobId: string;
  acpSessionId: string;
  sandboxSessionId: string | null; // null until Story 3's sandbox session is created for this job
  modelRequestIds: string[]; // appended as model calls happen
}
```

Every `DashboardEvent` carries `jobId`. The dashboard subscribes only to the selected job's stream
(Codex review §2.7) — concurrent or retried jobs never bleed into each other's display.

---

## Amendment log

- **v0.1 (2026-09-03):** Initial version, produced by Story 0 Task 2, before any of Stories 2/3/6/8
  have real implementation experience against these shapes. Expect amendments once real APIs are
  touched — this is a starting contract, not a finished spec.
