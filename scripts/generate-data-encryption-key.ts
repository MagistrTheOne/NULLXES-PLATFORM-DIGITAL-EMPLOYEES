import { randomBytes } from "node:crypto";

/**
 * Generates a 32-byte AES-256 key encoded as base64 for DATA_ENCRYPTION_KEY.
 *
 * Usage:
 *   npm run crypto:keygen
 *   # Add output to .env: DATA_ENCRYPTION_KEY=<value>
 */
const key = randomBytes(32).toString("base64");

console.log("Add to your environment (local .env and production secrets):");
console.log("");
console.log(`DATA_ENCRYPTION_KEY=${key}`);
console.log("");
console.log("Then run: npm run secrets:migrate");
