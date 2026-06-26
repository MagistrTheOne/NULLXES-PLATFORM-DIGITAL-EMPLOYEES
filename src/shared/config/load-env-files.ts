import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function applyEnvFile(filePath: string, override: boolean): void {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");

  // Robust parser: extract KEY=VALUE pairs even if newlines are missing.
  // Matches sequences like FOO=barBAZ=qux or normal lines.
  const keyValueRegex = /([A-Z_][A-Z0-9_]*)\s*=\s*("[^"]*"|'[^']*'|[^\s=]+)/g;

  let match: RegExpExecArray | null;
  while ((match = keyValueRegex.exec(content)) !== null) {
    const key = match[1];
    let value = match[2] ?? "";

    // Strip surrounding quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    value = value.trim();

    // If the extracted value still looks like it glommed another key (shouldn't with regex),
    // take only up to the next KEY pattern.
    const nextKeyMatch = value.match(/[A-Z_][A-Z0-9_]*=/);
    if (nextKeyMatch) {
      value = value.slice(0, nextKeyMatch.index).trim();
    }

    if (!key || !value) {
      continue;
    }

    if (!override && process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = value;
  }
}

/** Loads standard and Windows `.ENV` files before Next reads config. */
export function loadEnvFiles(projectDir = process.cwd()): void {
  applyEnvFile(resolve(projectDir, ".env"), false);
  applyEnvFile(resolve(projectDir, ".env.local"), true);
  applyEnvFile(resolve(projectDir, ".ENV"), false);
  applyEnvFile(resolve(projectDir, ".env.development"), false);
  applyEnvFile(resolve(projectDir, ".env.development.local"), true);
}
