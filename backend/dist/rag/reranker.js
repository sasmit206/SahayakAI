"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rerankCandidates = rerankCandidates;
const env_1 = require("../config/env");
let rerankerPromise = null;
async function getReranker() {
    if (!rerankerPromise) {
        try {
            const { pipeline } = await eval('import("@xenova/transformers")');
            rerankerPromise = pipeline('text-classification', env_1.config.RERANKER_MODEL);
        }
        catch (err) {
            console.warn('Failed to dynamically import @xenova/transformers, trying require:', err);
            try {
                const { pipeline } = require('@xenova/transformers');
                rerankerPromise = pipeline('text-classification', env_1.config.RERANKER_MODEL);
            }
            catch (requireErr) {
                throw new Error(`Could not load @xenova/transformers for reranking: ${requireErr}`);
            }
        }
    }
    return rerankerPromise;
}
async function rerankCandidates(query, candidates, topK = 5) {
    if (candidates.length === 0)
        return [];
    try {
        const reranker = await getReranker();
        const scoredCandidates = await Promise.all(candidates.map(async (doc) => {
            try {
                // Truncate document text to avoid exceeding token limit (512 tokens)
                const docText = doc.searchText.slice(0, 1000);
                // Call classification pipeline with pair
                const output = await reranker(query, { text_pair: docText });
                // bge-reranker models typically output logit or score in label 'LABEL_0' or 'LABEL_1'
                // We extract the score field.
                const score = output[0]?.score !== undefined ? output[0].score : 0;
                return { doc, score };
            }
            catch (innerErr) {
                console.warn(`[Reranker] Failed to score document: ${doc.schemeName}`, innerErr);
                return { doc, score: 0 };
            }
        }));
        // Sort descending by score
        scoredCandidates.sort((a, b) => b.score - a.score);
        return scoredCandidates.slice(0, topK).map(sc => sc.doc);
    }
    catch (err) {
        console.error('[Reranker] Failed to run local reranking. Falling back to input order.', err);
        // Fallback: return the first topK of candidates in the order they were retrieved
        return candidates.slice(0, topK);
    }
}
exports.default = rerankCandidates;
