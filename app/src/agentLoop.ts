import type OpenAI from "openai";
import { normalizeToolCalls } from "./normalizer.js";
import { withRetry, type ClassifiedError } from "./retry.js";
import type { ToolInvocation, ToolResult } from "./types.js";

export type ToolDispatcher = (invocation: ToolInvocation) => Promise<ToolResult>;

export interface RunAgentTaskOptions {
  client: OpenAI;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  tools: Array<Record<string, unknown>>;
  dispatch: ToolDispatcher;
  maxIterations?: number;
  maxWallClockMs?: number;
  signal?: AbortSignal;
}

export type AgentTaskOutcome =
  | { status: "completed"; finalMessage: string; iterations: number; toolCallLog: ToolInvocation[] }
  | { status: "max_iterations_exceeded"; iterations: number; toolCallLog: ToolInvocation[] }
  | { status: "timed_out"; elapsedMs: number; toolCallLog: ToolInvocation[] }
  | { status: "cancelled"; toolCallLog: ToolInvocation[] }
  | { status: "error"; error: { code: string; message: string }; toolCallLog: ToolInvocation[] };

const DEFAULT_MAX_ITERATIONS = 8;
const DEFAULT_MAX_WALL_CLOCK_MS = 60_000;

/**
 * A real bounded multi-turn agent loop — not a single reasoning step.
 * Story 2 AC 2: message-history construction, tool-execution callback, tool-result
 * re-insertion, iteration cap, wall-clock cap, cancellation, defined terminal state.
 */
export async function runAgentTask(opts: RunAgentTaskOptions): Promise<AgentTaskOutcome> {
  const maxIterations = opts.maxIterations ?? DEFAULT_MAX_ITERATIONS;
  const maxWallClockMs = opts.maxWallClockMs ?? DEFAULT_MAX_WALL_CLOCK_MS;
  const startedAt = Date.now();
  const toolCallLog: ToolInvocation[] = [];

  const messages: Array<{ role: "system" | "user" | "assistant" | "tool"; content: string; tool_call_id?: string; tool_calls?: unknown }> = [
    { role: "system", content: opts.systemPrompt },
    { role: "user", content: opts.userPrompt },
  ];

  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    if (opts.signal?.aborted) {
      return { status: "cancelled", toolCallLog };
    }
    const elapsed = Date.now() - startedAt;
    if (elapsed > maxWallClockMs) {
      return { status: "timed_out", elapsedMs: elapsed, toolCallLog };
    }

    let response;
    try {
      response = await withRetry(() =>
        opts.client.chat.completions.create({
          model: opts.model,
          messages: messages as never,
          tools: opts.tools as never,
          tool_choice: "auto",
        })
      );
    } catch (err) {
      const classified = err as ClassifiedError;
      return {
        status: "error",
        error: { code: classified.code ?? "UNKNOWN", message: classified.message ?? String(err) },
        toolCallLog,
      };
    }

    const message = response.choices[0]?.message;
    if (!message) {
      return { status: "error", error: { code: "EMPTY_RESPONSE", message: "No message in response" }, toolCallLog };
    }

    const invocations = normalizeToolCalls(response);

    if (invocations.length === 0) {
      // No tool calls — treat as the final deliverable.
      return {
        status: "completed",
        finalMessage: message.content ?? "",
        iterations: iteration,
        toolCallLog,
      };
    }

    // Append the assistant's tool-call message, then execute each tool and append results.
    messages.push({
      role: "assistant",
      content: message.content ?? "",
      tool_calls: message.tool_calls,
    });

    for (const invocation of invocations) {
      toolCallLog.push(invocation);
      const result = await opts.dispatch(invocation);
      messages.push({
        role: "tool",
        tool_call_id: invocation.id,
        content: JSON.stringify(result.ok ? result.result : result.error),
      });
    }
  }

  return { status: "max_iterations_exceeded", iterations: maxIterations, toolCallLog };
}
