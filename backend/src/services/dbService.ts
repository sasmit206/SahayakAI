import { SchemeDocument } from '../ingestion/normalizer';
import { loadSchemes } from '../ingestion/csvLoader';
import { BM25Retriever } from '../rag/bm25Retriever';
import { config } from '../config/env';

let allSchemesInMemory: SchemeDocument[] = [];
let bm25Index: BM25Retriever | null = null;

export async function initializeDbService(limit?: number) {
  if (allSchemesInMemory.length === 0) {
    console.log('Initializing InMemory Database Service...');
    try {
      const schemes = await loadSchemes(config.CSV_PATH);

      // Default = load ALL schemes
      const finalLimit =
        limit !== undefined
          ? limit
          : (process.env.INGEST_LIMIT
              ? parseInt(process.env.INGEST_LIMIT, 10)
              : 0);

      if (finalLimit > 0 && finalLimit < schemes.length) {
        allSchemesInMemory = schemes.slice(0, finalLimit);
        console.log(`Limited in-memory DB to ${finalLimit} schemes for performance.`);
      } else {
        allSchemesInMemory = schemes;
        console.log(`Loaded ALL ${schemes.length} schemes into memory.`);
      }

      bm25Index = new BM25Retriever(allSchemesInMemory);

      console.log(
        `InMemory Database loaded with ${allSchemesInMemory.length} schemes and BM25 index initialized.`
      );
    } catch (err) {
      console.error('Failed to initialize in-memory DB service:', err);
    }
  }
}

export function getAllSchemes(): SchemeDocument[] {
  return allSchemesInMemory;
}

/**
 * Adds newly ingested (e.g. PDF-sourced) schemes to the in-memory store
 * and rebuilds the BM25 index so they are immediately searchable without
 * restarting the server.
 */
export function addSchemesToMemory(newSchemes: SchemeDocument[]): void {
  if (newSchemes.length === 0) return;

  const existingIds = new Set(
    allSchemesInMemory.map((s) => s.schemeId)
  );

  const deduped = newSchemes.filter(
    (s) => !existingIds.has(s.schemeId)
  );

  allSchemesInMemory = [...allSchemesInMemory, ...deduped];

  bm25Index = new BM25Retriever(allSchemesInMemory);

  console.log(
    `[dbService] Added ${deduped.length} new scheme(s) to in-memory DB. Total: ${allSchemesInMemory.length}`
  );
}

export function getBm25Index(): BM25Retriever {
  if (!bm25Index) {
    bm25Index = new BM25Retriever(allSchemesInMemory);
  }
  return bm25Index;
}

export default initializeDbService;