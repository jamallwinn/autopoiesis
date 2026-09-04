import OpenAI from "openai";

// Canonical base URL resolved in Story 1 (see docs/stories/epic-1-story-1.md Verification).
export const NEBIUS_BASE_URL = "https://api.tokenfactory.nebius.com/v1/";
export const NEMOTRON_MODEL = "nvidia/nemotron-3-super-120b-a12b";

export function makeNemotronClient(): OpenAI {
  const apiKey = process.env.NEBIUS_API_KEY;
  if (!apiKey) throw new Error("NEBIUS_API_KEY is not set");
  return new OpenAI({ baseURL: NEBIUS_BASE_URL, apiKey });
}
