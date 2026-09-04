import fs from "node:fs";
import path from "node:path";
import { normalizeToolCalls } from "../src/normalizer.js";

// Load the real captured response from the Task 3 run (not a hand-written fixture).
const raw = fs.readFileSync(path.resolve(import.meta.dirname, "../../.tmp-real-response.json"), "utf8");
const rawResponse = JSON.parse(raw);

const invocations = normalizeToolCalls(rawResponse);

console.log("=== Normalized ToolInvocation[] from REAL captured response ===");
console.log(JSON.stringify(invocations, null, 2));

// Assertions
const failures: string[] = [];
if (invocations.length !== 1) failures.push(`Expected 1 invocation, got ${invocations.length}`);
const inv = invocations[0];
if (!inv) failures.push("No invocation found");
else {
  if (inv.name !== "coding.write_file") failures.push(`Expected name coding.write_file, got ${inv.name}`);
  if (inv.source !== "native") failures.push(`Expected source native, got ${inv.source}`);
  if (typeof inv.arguments.relativePath !== "string") failures.push("arguments.relativePath missing/wrong type");
  if (typeof inv.arguments.content !== "string") failures.push("arguments.content missing/wrong type");
  if (!inv.id) failures.push("id missing");
}

if (failures.length > 0) {
  console.error("\n=== UNIT TEST FAILED ===");
  failures.forEach((f) => console.error("- " + f));
  process.exit(1);
} else {
  console.log("\n=== UNIT TEST PASSED — normalizer correctly parsed the real captured response ===");
}
