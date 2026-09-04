import "dotenv/config";
import path from "node:path";
import dotenv from "dotenv";

// Load the parent project's .env (this app/ folder is nested one level in).
dotenv.config({ path: path.resolve(import.meta.dirname, "../../.env") });

const key = process.env.NEBIUS_API_KEY;
console.log("NEBIUS_API_KEY present:", Boolean(key));
console.log("NEBIUS_API_KEY length:", key ? key.length : 0);
