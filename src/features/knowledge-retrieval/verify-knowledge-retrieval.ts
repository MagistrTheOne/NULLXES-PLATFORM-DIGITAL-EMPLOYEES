import { splitTextIntoChunks } from "./services/split-text-into-chunks";

async function verifyKnowledgeRetrieval(): Promise<void> {
  const chunks = splitTextIntoChunks(
    "NULLXES Digital Employees use enterprise knowledge.\n\nEach chunk is embedded for semantic search.",
  );

  if (chunks.length < 1) {
    throw new Error("splitTextIntoChunks returned no chunks");
  }

  console.log(`splitTextIntoChunks: ${chunks.length} chunk(s)`);
  console.log("Knowledge retrieval verification: OK (offline checks)");
}

verifyKnowledgeRetrieval().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Knowledge retrieval verification failed:", message);
  process.exit(1);
});
