// Mirrors docs/architecture/shared-contract.md v0.1 — do not diverge without amending that file.

export interface ToolInvocation {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  source: "native" | "fallback";
}

export interface ToolResult {
  invocationId: string;
  ok: boolean;
  result?: Record<string, unknown>;
  error?: { code: string; message: string };
}

// --- coding.* tool argument/result shapes (Story 3 implements these for real; Story 2 stubs them) ---

export interface WriteFileArgs {
  relativePath: string;
  content: string;
  encoding: "utf8" | "base64";
  expectedPreviousHash?: string;
}

export interface WriteFileResult {
  path: string;
  bytesWritten: number;
  sha256: string;
}

export interface RunCommandArgs {
  argv: string[];
  cwd: string;
  timeoutMs: number;
  envAllowlist: string[];
}

export interface RunCommandResult {
  status: "ok" | "error";
  exitCode: number | null;
  signal: string | null;
  timedOut: boolean;
  stdout: string;
  stderr: string;
  durationMs: number;
  truncated: boolean;
}

export interface RunTestsResult extends RunCommandResult {
  discoveredTests: number;
  passedTests: number;
  failedTests: number;
  artifactDigest: string;
}
