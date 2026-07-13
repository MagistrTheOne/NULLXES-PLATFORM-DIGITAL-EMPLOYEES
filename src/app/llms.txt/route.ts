import { DOCS_CORPUS } from "../docs/_lib/docs-corpus";
import { DOCS_LEGAL_ENTITY } from "../docs/_lib/docs-legal";

export const dynamic = "force-static";

export function GET(): Response {
  const origin = `https://${DOCS_LEGAL_ENTITY.domain}`;
  const lines = [
    `# NULLXES Digital Employees`,
    ``,
    `> Digital Workforce Operating System. Human docs: ${origin}/docs. Docs assistant (Yuki Nakora): ${origin}/docs/assistant.`,
    ``,
    `## Documentation`,
    ...DOCS_CORPUS.map(
      (chunk) =>
        `- [${chunk.title}](${origin}${chunk.href}): ${chunk.body.split("\n")[0]}`,
    ),
    ``,
    `## API`,
    `- [OpenAPI YAML](${origin}/api/docs): Public REST API v1 machine spec`,
    `- [Public API guide](${origin}/docs/api): Scopes, endpoints, examples`,
    ``,
    `## Optional`,
    `- [Full docs dump](${origin}/llms-full.txt): Concatenated corpus for agents`,
    `- [Trust Center](${origin}/trust): Security posture (static)`,
    `- [Changelog](${origin}/docs/changelog): Documentation portal changes`,
    ``,
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
