import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
dotenv.config({ path: path.resolve(import.meta.dirname, "../../.env") });

import { makeNemotronClient, NEMOTRON_MODEL } from "../src/nemotronClient.js";
import { CODING_TOOLS } from "../src/tools.js";

async function main() {
  const client = makeNemotronClient();

  const response = await client.chat.completions.create({
    model: NEMOTRON_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a coding agent. When asked to write code, use the coding.write_file tool to save it, then use coding.run_tests to verify it.",
      },
      {
        role: "user",
        content:
          "Write a Python function `reverse_string(s)` that reverses a string, save it to solution.py, then run the tests.",
      },
    ],
    tools: CODING_TOOLS,
    tool_choice: "auto",
  });

  console.log("=== RAW RESPONSE (full JSON) ===");
  console.log(JSON.stringify(response, null, 2));

  const savePath = path.resolve(import.meta.dirname, "../../.tmp-real-response.json");
  fs.writeFileSync(savePath, JSON.stringify(response, null, 2));
  console.log(`\n(saved real response to ${savePath} for the normalizer unit test)`);

  const message = response.choices[0]?.message;
  console.log("\n=== ANALYSIS ===");
  console.log("finish_reason:", response.choices[0]?.finish_reason);
  console.log("has tool_calls field:", "tool_calls" in (message ?? {}));
  console.log("tool_calls value:", JSON.stringify(message?.tool_calls));
  console.log("content:", message?.content);
}

main().catch((err) => {
  console.error("ERROR:", err);
  process.exit(1);
});
