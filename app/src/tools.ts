// coding.* tool schema, per docs/architecture/shared-contract.md §2-4.
// Story 3 gives these real SandboxAdapter-backed implementations; Story 2 only defines the
// schema so the model can call them, and stubs the handler so the loop's shape is provable now.

export const CODING_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "coding.write_file",
      description: "Write a file into the sandbox workspace.",
      parameters: {
        type: "object",
        properties: {
          relativePath: { type: "string", description: "Path relative to the workspace root." },
          content: { type: "string" },
          encoding: { type: "string", enum: ["utf8", "base64"] },
        },
        required: ["relativePath", "content", "encoding"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "coding.run_tests",
      description: "Run the test suite in the sandbox and return pass/fail results.",
      parameters: {
        type: "object",
        properties: {
          argv: { type: "array", items: { type: "string" } },
          cwd: { type: "string" },
          timeoutMs: { type: "number" },
        },
        required: ["argv", "cwd", "timeoutMs"],
      },
    },
  },
];

/**
 * Story 2 stub — always returns a fixed, clearly-labeled-fake result. Story 3 replaces this
 * with a real SandboxAdapter-backed implementation. Never used past Story 2's own testing.
 */
export function stubCodingToolHandler(name: string, args: Record<string, unknown>) {
  if (name === "coding.write_file") {
    return {
      ok: true,
      result: { path: args.relativePath, bytesWritten: String(args.content ?? "").length, sha256: "STUB-NOT-REAL" },
    };
  }
  if (name === "coding.run_tests") {
    return {
      ok: true,
      result: {
        status: "ok",
        exitCode: 0,
        signal: null,
        timedOut: false,
        stdout: "[STUB] no real sandbox in Story 2",
        stderr: "",
        durationMs: 1,
        truncated: false,
        discoveredTests: 0,
        passedTests: 0,
        failedTests: 0,
        artifactDigest: "STUB-NOT-REAL",
      },
    };
  }
  return { ok: false, error: { code: "UNKNOWN_TOOL", message: `No stub handler for ${name}` } };
}
