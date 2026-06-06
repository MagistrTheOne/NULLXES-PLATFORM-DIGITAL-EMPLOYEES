import { backfillReadySourcesWithoutEmbeddings } from "@/features/knowledge-retrieval";

async function main(): Promise<void> {
  const processed = await backfillReadySourcesWithoutEmbeddings();
  console.log(`Backfilled embeddings for ${processed} knowledge source(s).`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Knowledge embedding backfill failed:", message);
  process.exit(1);
});
