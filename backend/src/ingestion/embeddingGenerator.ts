import { config } from '../config/env';

let pipelinePromise: any = null;

async function getPipeline() {
  if (!pipelinePromise) {
    console.log(`[EmbeddingGenerator] Loading embedding model: ${config.EMBEDDING_MODEL}`);
    try {
      // Use dynamic import to handle ES module load in Node/CommonJS
      const { pipeline } = await eval('import("@xenova/transformers")');
      pipelinePromise = pipeline('feature-extraction', config.EMBEDDING_MODEL);
    } catch (err) {
      console.error('Failed to import @xenova/transformers dynamically, trying require:', err);
      try {
        const { pipeline } = require('@xenova/transformers');
        pipelinePromise = pipeline('feature-extraction', config.EMBEDDING_MODEL);
      } catch (requireErr) {
        throw new Error(`Could not load @xenova/transformers: ${requireErr}`);
      }
    }
  }
  return pipelinePromise;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const extractor = await getPipeline();
  // Truncate text roughly to fit token limit (512 tokens is about 2000 characters)
  const truncated = text.slice(0, 2000);
  const output = await extractor(truncated, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

export async function generateEmbeddingsBatch(
  texts: string[],
  batchSize = 16,
  onProgress?: (completed: number) => void
): Promise<number[][]> {
  const extractor = await getPipeline();
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map(async (text) => {
        const truncated = text.slice(0, 2000);
        const output = await extractor(truncated, { pooling: 'mean', normalize: true });
        return Array.from(output.data) as number[];
      })
    );
    
    results.push(...batchResults);
    
    if (onProgress) {
      onProgress(results.length);
    }
  }

  return results;
}
