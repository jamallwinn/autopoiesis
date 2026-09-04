import type { ToolInvocation } from "./types.js";

/**
 * Converts a raw Nebius/Nemotron chat-completion response into normalized ToolInvocation[].
 *
 * Confirmed live 2026-09-04 (see docs/stories/epic-1-story-2.md Verification, Task 3 run): the
 * Nebius Token Factory OpenAI-compatible API returns standard OpenAI tool_calls shape —
 * message.tool_calls: [{ id, type: "function", function: { name, arguments: <JSON string> } }].
 * This is NATIVE mode. There is no fallback path exercised in this normalizer unless native mode
 * stops being available — if that ever happens, this function is the amendment point, and
 * docs/architecture/shared-contract.md must be updated to say so.
 */
export function normalizeToolCalls(rawResponse: unknown): ToolInvocation[] {
  const response = rawResponse as {
    choices?: Array<{ message?: { tool_calls?: Array<{ id: string; type: string; function: { name: string; arguments: string } }> } }>;
  };

  const toolCalls = response.choices?.[0]?.message?.tool_calls;
  if (!toolCalls || toolCalls.length === 0) return [];

  return toolCalls.map((tc): ToolInvocation => {
    let parsedArgs: Record<string, unknown>;
    try {
      parsedArgs = JSON.parse(tc.function.arguments);
    } catch {
      // Malformed JSON from the model — surfaced as a distinguishable shape, not a thrown error,
      // so the agent loop's failure-mode handling (Story 2 Task 4) can classify it.
      parsedArgs = { __PARSE_ERROR__: true, raw: tc.function.arguments };
    }
    return {
      id: tc.id,
      name: tc.function.name,
      arguments: parsedArgs,
      source: "native",
    };
  });
}
