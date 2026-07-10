import { DOCS_CORPUS } from "../docs/_lib/docs-corpus";
import { DOCS_LEGAL_ENTITY } from "../docs/_lib/docs-legal";

export const dynamic = "force-static";

export function GET(): Response {
  const origin = `https://${DOCS_LEGAL_ENTITY.domain}`;
  const body = [
    `# NULLXES Digital Employees — full documentation corpus`,
    ``,
    `Source: ${origin}/docs · Generated for LLM agents · ${new Date().toISOString().slice(0, 10)}`,
    ``,
    ...DOCS_CORPUS.flatMap((chunk) => [
      `## ${chunk.title}`,
      ``,
      `URL: ${origin}${chunk.href}`,
      ``,
      chunk.body,
      ``,
    ]),
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
