"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retrieveHybrid = retrieveHybrid;
const dbService_1 = require("../services/dbService");
const vectorRetriever_1 = require("./vectorRetriever");
async function retrieveHybrid(query, limit = 30) {
    // Get in-memory BM25 index
    const bm25Index = (0, dbService_1.getBm25Index)();
    // Search BM25 (fetch double the limit to ensure rich candidates for fusion)
    const bm25Results = bm25Index.search(query, limit * 2);
    // Search Vector Database
    const vectorResults = await (0, vectorRetriever_1.queryVectorDB)(query, limit * 2);
    // Apply Reciprocal Rank Fusion (RRF)
    const docMap = new Map();
    const rrfScores = new Map();
    const k = 60; // standard smoothing parameter
    bm25Results.forEach((res, index) => {
        const id = res.doc.schemeId;
        docMap.set(id, res.doc);
        const rank = index + 1;
        rrfScores.set(id, (rrfScores.get(id) || 0) + 1 / (k + rank));
    });
    vectorResults.forEach((res, index) => {
        const id = res.doc.schemeId;
        docMap.set(id, res.doc);
        const rank = index + 1;
        rrfScores.set(id, (rrfScores.get(id) || 0) + 1 / (k + rank));
    });
    const fusedResults = Array.from(rrfScores.entries()).map(([id, rrfScore]) => ({
        doc: docMap.get(id),
        score: rrfScore
    }));
    // Sort descending by RRF score
    fusedResults.sort((a, b) => b.score - a.score);
    return fusedResults.slice(0, limit);
}
exports.default = retrieveHybrid;
