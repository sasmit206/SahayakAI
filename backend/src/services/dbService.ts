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
      
      // We can apply the same limit as ingestion for developer speed
      const finalLimit = limit !== undefined ? limit : (process.env.INGEST_LIMIT ? parseInt(process.env.INGEST_LIMIT, 10) : 150);
      
      if (finalLimit > 0 && finalLimit < schemes.length) {
        allSchemesInMemory = schemes.slice(0, finalLimit);
        console.log(`Limited in-memory DB to ${finalLimit} schemes for performance.`);
      } else {
        allSchemesInMemory = schemes;
      }
      
      bm25Index = new BM25Retriever(allSchemesInMemory);
      console.log(`InMemory Database loaded with ${allSchemesInMemory.length} schemes and BM25 index initialized.`);
    } catch (err) {
      console.error('Failed to initialize in-memory DB service:', err);
    }
  }
}

export function getAllSchemes(): SchemeDocument[] {
  return allSchemesInMemory;
}

export function getBm25Index(): BM25Retriever {
  if (!bm25Index) {
    // Fallback instantiation to prevent crashes
    bm25Index = new BM25Retriever(allSchemesInMemory);
  }
  return bm25Index;
}
export default initializeDbService;
