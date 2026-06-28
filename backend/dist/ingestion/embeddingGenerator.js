"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEmbedding = generateEmbedding;
exports.generateEmbeddingsBatch = generateEmbeddingsBatch;
const env_1 = require("../config/env");
let pipelinePromise = null;
async function getPipeline() {
    if (!pipelinePromise) {
        try {
            // Use dynamic import to handle ES module load in Node/CommonJS
            const { pipeline } = await eval('import("@xenova/transformers")');
            pipelinePromise = pipeline('feature-extraction', env_1.config.EMBEDDING_MODEL);
        }
        catch (err) {
            console.error('Failed to import @xenova/transformers dynamically, trying require:', err);
            try {
                const { pipeline } = require('@xenova/transformers');
                pipelinePromise = pipeline('feature-extraction', env_1.config.EMBEDDING_MODEL);
            }
            catch (requireErr) {
                throw new Error(`Could not load @xenova/transformers: ${requireErr}`);
            }
        }
    }
    return pipelinePromise;
}
async function generateEmbedding(text) {
    const extractor = await getPipeline();
    // Truncate text roughly to fit token limit (512 tokens is about 2000 characters)
    const truncated = text.slice(0, 2000);
    const output = await extractor(truncated, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
}
async function generateEmbeddingsBatch(texts, batchSize = 16, onProgress) {
    const extractor = await getPipeline();
    const results = [];
    for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(async (text) => {
            const truncated = text.slice(0, 2000);
            const output = await extractor(truncated, { pooling: 'mean', normalize: true });
            return Array.from(output.data);
        }));
        results.push(...batchResults);
        if (onProgress) {
            onProgress(results.length);
        }
    }
    return results;
}
