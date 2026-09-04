import dotenv from "dotenv";
import path from "node:path";
dotenv.config({ path: path.resolve(import.meta.dirname, "../../.env") });

import OpenAI from "openai";
import { makeNemotronClient, NEBIUS_BASE_URL, NEMOTRON_MODEL } from "../src/nemotronClient.js";
import { classifyError, withRetry } from "../src/retry.js";
import { normalizeToolCalls } from "../src/normalizer.js";
import { CODING_TOOLS } from "../src/tools.js";

const results: Array<{ condition: string; mode: "REAL" | "MOCKED"; passed: boolean; detail: string }> = [];

function record(condition: string, mode: "REAL" | "MOCKED", passed: boolean, detail: string) {
  results.push({ condition, mode, passed, detail });
  console.log(`[${passed ? "PASS" : "FAIL"}] (${mode}) ${condition}: ${detail}`);
}

// --- 1. Rate limit (429) — MOCKED: cannot induce a real 429 without abusing the live API. ---
async function testRateLimit() {
  let attempts = 0;
  try {
    await withRetry(
      async () => {
        attempts++;
        if (attempts < 3) {
          const err = { status: 429, message: "Rate limited (mocked)" };
          throw err;
        }
        return "ok";
      },
      { maxAttempts: 3, baseDelayMs: 10, maxDelayMs: 50 }
    );
    record("HTTP 429 rate limit", "MOCKED", attempts === 3, `Retried ${attempts} times then succeeded, as expected for a retryable class`);
  } catch (e) {
    record("HTTP 429 rate limit", "MOCKED", false, `Unexpectedly threw: ${JSON.stringify(e)}`);
  }
}

// --- 2. Server error (5xx) — MOCKED, same reason. ---
async function testServerError() {
  let attempts = 0;
  try {
    await withRetry(
      async () => {
        attempts++;
        throw { status: 503, message: "Service unavailable (mocked)" };
      },
      { maxAttempts: 3, baseDelayMs: 10, maxDelayMs: 50 }
    );
    record("HTTP 5xx server error", "MOCKED", false, "Should have thrown after exhausting retries");
  } catch (e) {
    const classified = e as { class: string; code: string };
    record(
      "HTTP 5xx server error",
      "MOCKED",
      attempts === 3 && classified.class === "retryable",
      `Retried ${attempts} times (capped), then surfaced as retryable/${classified.code} — correct: retries are bounded, not infinite`
    );
  }
}

// --- 3. Timeout — REAL, induced via a 1ms client timeout. ---
async function testTimeout() {
  const client = new OpenAI({ baseURL: NEBIUS_BASE_URL, apiKey: process.env.NEBIUS_API_KEY, timeout: 1 });
  try {
    await withRetry(
      () =>
        client.chat.completions.create({
          model: NEMOTRON_MODEL,
          messages: [{ role: "user", content: "hello" }],
        }),
      { maxAttempts: 2, baseDelayMs: 10, maxDelayMs: 50 }
    );
    record("Request timeout", "REAL", false, "Expected a timeout error, request succeeded instead");
  } catch (e) {
    const classified = e as { class: string; code: string };
    record("Request timeout", "REAL", classified.class === "retryable", `Classified as ${classified.class}/${classified.code}`);
  }
}

// --- 4. Malformed tool-call arguments — REAL code path, synthetic malformed input. ---
function testMalformedToolArgs() {
  const fakeResponse = {
    choices: [
      {
        message: {
          tool_calls: [
            { id: "call_1", type: "function", function: { name: "coding.write_file", arguments: "{not valid json!!" } },
          ],
        },
      },
    ],
  };
  const invocations = normalizeToolCalls(fakeResponse);
  const parseErrorFlagged = invocations[0]?.arguments?.__PARSE_ERROR__ === true;
  record(
    "Malformed tool-call arguments",
    "REAL", // real code path (normalizeToolCalls), synthetic-but-realistic malformed input
    invocations.length === 1 && parseErrorFlagged,
    `normalizeToolCalls did not throw; flagged __PARSE_ERROR__ so the caller can classify it as non-retryable, invocations=${JSON.stringify(invocations)}`
  );
}

// --- 5. Empty/refusal response — REAL code path, synthetic empty response. ---
function testEmptyResponse() {
  const emptyResponse = { choices: [] };
  const invocations = normalizeToolCalls(emptyResponse);
  record(
    "Empty response (no choices)",
    "REAL", // real code path, synthetic input since inducing a live refusal isn't reliably repeatable
    Array.isArray(invocations) && invocations.length === 0,
    `normalizeToolCalls returned [] rather than throwing — agentLoop.ts treats this as 'no tool calls' -> completed with empty finalMessage, not a hang`
  );
}

// --- 6. Context-length overflow — REAL, induced via an oversized prompt. ---
async function testContextOverflow() {
  const client = makeNemotronClient();
  const hugePrompt = "word ".repeat(2_000_000); // far beyond any realistic context window
  try {
    await withRetry(
      () =>
        client.chat.completions.create({
          model: NEMOTRON_MODEL,
          messages: [{ role: "user", content: hugePrompt }],
          tools: CODING_TOOLS,
        }),
      { maxAttempts: 2, baseDelayMs: 10, maxDelayMs: 50 }
    );
    record("Context-length overflow", "REAL", false, "Expected a 400-class error, request succeeded instead");
  } catch (e) {
    const classified = e as { class: string; code: string; message: string };
    record(
      "Context-length overflow",
      "REAL",
      classified.class === "non_retryable",
      `Classified as ${classified.class}/${classified.code}: ${classified.message.slice(0, 200)}`
    );
  }
}

async function main() {
  await testRateLimit();
  await testServerError();
  await testTimeout();
  testMalformedToolArgs();
  testEmptyResponse();
  await testContextOverflow();

  console.log("\n=== FAILURE-MODE MATRIX SUMMARY ===");
  results.forEach((r) => console.log(`${r.passed ? "PASS" : "FAIL"} | ${r.mode} | ${r.condition}`));
  const allPassed = results.every((r) => r.passed);
  console.log(`\nOverall: ${allPassed ? "ALL PASSED" : "SOME FAILED"} (${results.filter((r) => r.passed).length}/${results.length})`);
  if (!allPassed) process.exit(1);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
