"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSearchText = parseSearchText;
exports.queryVectorDB = queryVectorDB;
const chromadb_1 = require("chromadb");
const env_1 = require("../config/env");
const embeddingGenerator_1 = require("../ingestion/embeddingGenerator");
function parseSearchText(text, baseDoc) {
    const doc = { ...baseDoc };
    const extractField = (marker, nextMarkerReg) => {
        const startIdx = text.indexOf(marker);
        if (startIdx === -1)
            return '';
        const startContentIdx = startIdx + marker.length;
        const remainingText = text.substring(startContentIdx);
        const match = remainingText.match(nextMarkerReg);
        if (match && match.index !== undefined) {
            return remainingText.substring(0, match.index).trim();
        }
        return remainingText.trim();
    };
    const nextReg = /\n(Scheme Name|Category|Tags|Level|Details|Benefits|Eligibility Criteria|Application Process|Documents Required):/i;
    doc.details = extractField('Details: ', nextReg);
    doc.benefits = extractField('Benefits: ', nextReg);
    doc.eligibility = extractField('Eligibility Criteria: ', nextReg);
    doc.application = extractField('Application Process: ', nextReg);
    doc.documents = extractField('Documents Required: ', nextReg);
    return doc;
}
async function queryVectorDB(query, limit = 30) {
    const client = new chromadb_1.ChromaClient({ path: env_1.config.CHROMA_URL });
    const collectionName = 'sahayak_schemes';
    try {
        const collection = await client.getCollection({
            name: collectionName,
            embeddingFunction: null
        });
        const queryEmbedding = await (0, embeddingGenerator_1.generateEmbedding)(query);
        const results = await collection.query({
            queryEmbeddings: [queryEmbedding],
            nResults: limit
        });
        if (!results || !results.ids || results.ids[0].length === 0) {
            return [];
        }
        const output = [];
        const ids = results.ids[0];
        const metadatas = results.metadatas[0];
        const documents = results.documents[0];
        const distances = results.distances ? results.distances[0] : [];
        for (let i = 0; i < ids.length; i++) {
            const meta = metadatas[i];
            if (!meta)
                continue;
            const doc = {
                schemeId: meta.schemeId,
                schemeName: meta.schemeName,
                slug: meta.slug,
                level: meta.level,
                category: meta.category ? meta.category.split(',') : [],
                tags: meta.tags ? meta.tags.split(',') : [],
                states: meta.states ? meta.states.split(',') : [],
                gender: meta.gender,
                incomeLimit: meta.incomeLimit !== -1 ? meta.incomeLimit : null,
                minAge: meta.minAge !== -1 ? meta.minAge : null,
                maxAge: meta.maxAge !== -1 ? meta.maxAge : null,
                categories: meta.categories ? meta.categories.split(',') : [],
                occupations: meta.occupations ? meta.occupations.split(',') : [],
                disabilityOnly: meta.disabilityOnly === 1,
                details: '',
                benefits: '',
                eligibility: '',
                application: '',
                documents: '',
                searchText: documents[i] || '',
            };
            const reconstructedDoc = parseSearchText(documents[i] || '', doc);
            // Chroma distance is L2 or Cosine distance. If it is cosine distance, cosine similarity = 1 - distance
            // If it is L2, distance ranges from 0 to infinity. Let's normalize score to a reasonable 0-1 range.
            const dist = distances.length > i ? distances[i] : 0.5;
            const score = 1 / (1 + dist); // robust normalization for any distance metric
            output.push({ doc: reconstructedDoc, score });
        }
        return output;
    }
    catch (err) {
        console.error('Error querying ChromaDB:', err);
        return [];
    }
}
