const TEXT_FILE_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".csv",
  ".json",
  ".xml",
  ".html",
  ".htm",
]);

const MAX_KNOWLEDGE_CONTENT_CHARS = 200_000;
const URL_FETCH_TIMEOUT_MS = 15_000;

function truncateContent(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length <= MAX_KNOWLEDGE_CONTENT_CHARS) {
    return trimmed;
  }

  return trimmed.slice(0, MAX_KNOWLEDGE_CONTENT_CHARS);
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isReadableKnowledgeFile(file: File): boolean {
  if (file.type.startsWith("text/")) {
    return true;
  }

  const lowerName = file.name.toLowerCase();
  return [...TEXT_FILE_EXTENSIONS].some((ext) => lowerName.endsWith(ext));
}

export async function readKnowledgeFileContent(file: File): Promise<string> {
  if (!isReadableKnowledgeFile(file)) {
    throw new Error(
      `Unsupported file type for ${file.name}. Upload .txt, .md, .csv, or .json.`,
    );
  }

  const content = truncateContent(await file.text());
  if (!content) {
    throw new Error(`File ${file.name} is empty.`);
  }

  return content;
}

export async function fetchKnowledgeUrlContent(url: string): Promise<string> {
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http and https URLs are supported.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), URL_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "text/html, text/plain, application/json, */*" },
    });

    if (!response.ok) {
      throw new Error(`URL fetch failed with status ${response.status}`);
    }

    const raw = await response.text();
    const contentType = response.headers.get("content-type") ?? "";
    const content = contentType.includes("html")
      ? stripHtml(raw)
      : truncateContent(raw);

    if (!content) {
      throw new Error("URL returned no readable text content.");
    }

    return content;
  } finally {
    clearTimeout(timeout);
  }
}

export function normalizeKnowledgeTextContent(content: string): string {
  const normalized = truncateContent(content);
  if (!normalized) {
    throw new Error("Text content is empty.");
  }

  return normalized;
}
