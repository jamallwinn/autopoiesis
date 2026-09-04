import dotenv from "dotenv";
import path from "node:path";
dotenv.config({ path: path.resolve(import.meta.dirname, "../../.env") });

import { makeNemotronClient, NEMOTRON_MODEL } from "../src/nemotronClient.js";
import { CODING_TOOLS, stubCodingToolHandler } from "../src/tools.js";
import { runAgentTask } from "../src/agentLoop.js";
import type { ToolInvocation, ToolResult } from "../src/types.js";

const SYSTEM_PROMPT =
  "You are a coding agent. Use coding.write_file to save code, then coding.run_tests to verify it. " +
  "Once tests pass (or you've done what was asked), respond with a short final text summary and no more tool calls.";

async function dispatch(invocation: ToolInvocation): Promise<ToolResult> {
  const r = stubCodingToolHandler(invocation.name, invocation.arguments);
  return { invocationId: invocation.id, ...r } as ToolResult;
}

const PROMPTS = [
  "Write a Python function `is_palindrome(s)` that checks if a string is a palindrome, save it, run tests, then summarize.",
  "Write a Python function `fizzbuzz(n)` implementing FizzBuzz up to n, save it, run tests, then summarize.",
  "Write a Python function `factorial(n)` computing n!, save it, run tests, then summarize.",
];

async function runNormal() {
  const client = makeNemotronClient();
  let successes = 0;
  const results: string[] = [];

  for (const [i, prompt] of PROMPTS.entries()) {
    console.log(`\n=== PROMPT ${i + 1}/${PROMPTS.length}: ${prompt} ===`);
    const outcome = await runAgentTask({
      client,
      model: NEMOTRON_MODEL,
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: prompt,
      tools: CODING_TOOLS,
      dispatch,
      maxIterations: 8,
      maxWallClockMs: 60_000,
    });
    console.log("outcome.status:", outcome.status);
    console.log("tool calls made:", outcome.toolCallLog.map((t) => t.name).join(", "));
    if (outcome.status === "completed") {
      console.log("final message:", outcome.finalMessage);
      console.log("iterations used:", outcome.iterations);
      successes++;
      results.push(`PROMPT ${i + 1}: completed in ${outcome.iterations} iterations`);
    } else {
      results.push(`PROMPT ${i + 1}: ${outcome.status}`);
    }
  }

  console.log("\n=== SUCCESS RATE ===");
  console.log(`${successes}/${PROMPTS.length} completed successfully`);
  results.forEach((r) => console.log("- " + r));
}

async function runIterationCapTest() {
  console.log("\n\n=== DELIBERATE ITERATION-CAP TEST (maxIterations: 1, task needs 2+ turns) ===");
  const client = makeNemotronClient();
  const outcome = await runAgentTask({
    client,
    model: NEMOTRON_MODEL,
    systemPrompt: SYSTEM_PROMPT,
    userPrompt:
      "Write a Python function `is_prime(n)`, save it to solution.py using coding.write_file, then run the tests using coding.run_tests. Do these as two SEPARATE tool calls in two separate turns, not one.",
    tools: CODING_TOOLS,
    dispatch,
    maxIterations: 1, // deliberately too low — this task needs a write then a test-run
    maxWallClockMs: 60_000,
  });
  console.log("outcome.status:", outcome.status);
  console.log("tool calls made before cap hit:", outcome.toolCallLog.map((t) => t.name).join(", "));
  if (outcome.status !== "max_iterations_exceeded") {
    console.error("UNEXPECTED: expected max_iterations_exceeded, got", outcome.status);
  } else {
    console.log("CONFIRMED: iteration cap correctly stopped the loop rather than hanging or looping forever.");
  }
}

async function main() {
  await runNormal();
  await runIterationCapTest();
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
