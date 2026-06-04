import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function applyEnvFile(filePath: string, override: boolean): void {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
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
