import { readFile } from "node:fs/promises";
import path from "node:path";

export async function GET(): Promise<Response> {
  const specPath = path.join(process.cwd(), "public", "openapi.yaml");
  const spec = await readFile(specPath, "utf8");

  return new Response(spec, {
    headers: {
      "Content-Type": "text/yaml; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
