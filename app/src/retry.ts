export type ErrorClass = "retryable" | "non_retryable";

export interface ClassifiedError {
  class: ErrorClass;
  code: string;
  message: string;
}

/**
 * Classifies an error from the OpenAI-compatible client. Retryable: 429 (rate limit), 5xx
 * (server error), request timeout/network error. Non-retryable: auth (401/403), bad request
 * (400, e.g. context-length overflow), not-found (404, e.g. bad model id).
 */
export function classifyError(err: unknown): ClassifiedError {
  const e = err as { status?: number; code?: string; message?: string; constructor?: { name?: string } };

  // Confirmed live 2026-09-04 (docs/stories/epic-1-story-2.md Verification, Task 4): the openai
  // SDK does NOT set an own `.name` property on this error — the real signal is
  // `err.constructor.name === "APIConnectionTimeoutError"`. A prior version of this function
  // checked `e.name` directly and silently misclassified every real timeout as non-retryable —
  // caught by this story's own failure-mode test, fixed here.
  if (
    e.constructor?.name === "APIConnectionTimeoutError" ||
    e.code === "ETIMEDOUT" ||
    e.code === "ECONNABORTED"
  ) {
    return { class: "retryable", code: "TIMEOUT", message: e.message ?? "Request timed out" };
  }
  if (typeof e.status === "number") {
    if (e.status === 429) return { class: "retryable", code: "RATE_LIMITED", message: e.message ?? "Rate limited" };
    if (e.status >= 500) return { class: "retryable", code: `SERVER_ERROR_${e.status}`, message: e.message ?? "Server error" };
    if (e.status === 401 || e.status === 403) return { class: "non_retryable", code: "AUTH_FAILED", message: e.message ?? "Auth failed" };
    if (e.status === 400) return { class: "non_retryable", code: "BAD_REQUEST", message: e.message ?? "Bad request (e.g. context overflow)" };
    if (e.status === 404) return { class: "non_retryable", code: "NOT_FOUND", message: e.message ?? "Not found (e.g. bad model id)" };
  }
  return { class: "non_retryable", code: "UNKNOWN", message: e.message ?? String(err) };
}

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

/**
 * Bounded exponential backoff for retryable failures. Non-retryable failures throw immediately
 * (the classified error, not the raw one) after the first attempt.
 */
export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? 3;
  const baseDelayMs = opts.baseDelayMs ?? 200;
  const maxDelayMs = opts.maxDelayMs ?? 5_000;

  let lastError: ClassifiedError | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const classified = classifyError(err);
      lastError = classified;
      if (classified.class === "non_retryable" || attempt === maxAttempts) {
        throw classified;
      }
      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  // Unreachable, but satisfies TypeScript's control-flow analysis.
  throw lastError ?? { class: "non_retryable", code: "UNKNOWN", message: "Retry loop exited unexpectedly" };
}
