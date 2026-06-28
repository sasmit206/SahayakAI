"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDbService = initializeDbService;
exports.getAllSchemes = getAllSchemes;
exports.addSchemesToMemory = addSchemesToMemory;
exports.getBm25Index = getBm25Index;
const csvLoader_1 = require("../ingestion/csvLoader");
const bm25Retriever_1 = require("../rag/bm25Retriever");
const env_1 = require("../config/env");
let allSchemesInMemory = [];
let bm25Index = null;
async function initializeDbService(limit) {
    if (allSchemesInMemory.length === 0) {
        console.log('Initializing InMemory Database Service...');
        try {
            const schemes = await (0, csvLoader_1.loadSchemes)(env_1.config.CSV_PATH);
            // Default = load ALL schemes
            const finalLimit = limit !== undefined
                ? limit
                : (process.env.INGEST_LIMIT
                    ? parseInt(process.env.INGEST_LIMIT, 10)
                    : 0);
            if (finalLimit > 0 && finalLimit < schemes.length) {
                allSchemesInMemory = schemes.slice(0, finalLimit);
                console.log(`Limited in-memory DB to ${finalLimit} schemes for performance.`);
            }
            else {
                allSchemesInMemory = schemes;
                console.log(`Loaded ALL ${schemes.length} schemes into memory.`);
            }
            bm25Index = new bm25Retriever_1.BM25Retriever(allSchemesInMemory);
            console.log(`InMemory Database loaded with ${allSchemesInMemory.length} schemes and BM25 index initialized.`);
        }
        catch (err) {
            console.error('Failed to initialize in-memory DB service:', err);
        }
    }
}
function getAllSchemes() {
    return allSchemesInMemory;
}
/**
 * Adds newly ingested (e.g. PDF-sourced) schemes to the in-memory store
 * and rebuilds the BM25 index so they are immediately searchable without
 * restarting the server.
 */
function addSchemesToMemory(newSchemes) {
    if (newSchemes.length === 0)
        return;
    const existingIds = new Set(allSchemesInMemory.map((s) => s.schemeId));
    const deduped = newSchemes.filter((s) => !existingIds.has(s.schemeId));
    allSchemesInMemory = [...allSchemesInMemory, ...deduped];
    bm25Index = new bm25Retriever_1.BM25Retriever(allSchemesInMemory);
    console.log(`[dbService] Added ${deduped.length} new scheme(s) to in-memory DB. Total: ${allSchemesInMemory.length}`);
}
function getBm25Index() {
    if (!bm25Index) {
        bm25Index = new bm25Retriever_1.BM25Retriever(allSchemesInMemory);
    }
    return bm25Index;
}
exports.default = initializeDbService;
