"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const env_1 = require("../config/env");
const pdfLoader_1 = require("../ingestion/pdfLoader");
const pdfFieldExtractor_1 = require("../ingestion/pdfFieldExtractor");
const normalizer_1 = require("../ingestion/normalizer");
const csvAppender_1 = require("../ingestion/csvAppender");
const chromaUploader_1 = require("../ingestion/chromaUploader");
const csvLoader_1 = require("../ingestion/csvLoader");
const PDF_DIR = path_1.default.resolve(__dirname, '../../data/scheme_pdfs');
const PROCESSED_LOG = path_1.default.resolve(__dirname, '../../data/scheme_pdfs/.processed.json');
function loadProcessedSet() {
    if (!fs_1.default.existsSync(PROCESSED_LOG))
        return new Set();
    try {
        const arr = JSON.parse(fs_1.default.readFileSync(PROCESSED_LOG, 'utf-8'));
        return new Set(arr);
    }
    catch {
        return new Set();
    }
}
function saveProcessedSet(set) {
    fs_1.default.writeFileSync(PROCESSED_LOG, JSON.stringify(Array.from(set), null, 2), 'utf-8');
}
async function run() {
    console.log('--- Sahayak AI: PDF Scheme Ingestion ---');
    if (!fs_1.default.existsSync(PDF_DIR)) {
        fs_1.default.mkdirSync(PDF_DIR, { recursive: true });
        console.log(`Created folder ${PDF_DIR}. Drop scheme PDFs there and re-run this script.`);
        return;
    }
    const processed = loadProcessedSet();
    const pdfFiles = fs_1.default
        .readdirSync(PDF_DIR)
        .filter((f) => f.toLowerCase().endsWith('.pdf') && !processed.has(f));
    if (pdfFiles.length === 0) {
        console.log('No new PDF files found in data/scheme_pdfs/. Nothing to do.');
        return;
    }
    console.log(`Found ${pdfFiles.length} new PDF(s) to process.`);
    // Figure out a safe starting index so new schemeIds/slugs don't collide
    // with the existing CSV-loaded schemes.
    const existingSchemes = await (0, csvLoader_1.loadSchemes)(env_1.config.CSV_PATH);
    let index = existingSchemes.length;
    const newDocs = [];
    for (const file of pdfFiles) {
        const filePath = path_1.default.join(PDF_DIR, file);
        console.log(`\nProcessing: ${file}`);
        try {
            const { text, method } = await (0, pdfLoader_1.extractTextFromPdf)(filePath);
            console.log(`  Extracted ${text.length} chars via ${method}.`);
            if (text.length < 30) {
                console.warn(`  Skipping ${file}: extracted text too short to be useful.`);
                continue;
            }
            const fallbackName = path_1.default.basename(file, '.pdf').replace(/[-_]/g, ' ');
            const fields = await (0, pdfFieldExtractor_1.extractSchemeFields)(text, fallbackName);
            const doc = (0, normalizer_1.normalizeRow)(fields, index++);
            newDocs.push(doc);
            (0, csvAppender_1.appendSchemeToCsv)(env_1.config.CSV_PATH, fields);
            processed.add(file);
            console.log(`  ✓ Added scheme: "${doc.schemeName}" (${doc.schemeId})`);
        }
        catch (err) {
            console.error(`  ✗ Failed to process ${file}:`, err);
        }
    }
    if (newDocs.length > 0) {
        console.log(`\nUploading ${newDocs.length} new scheme(s) to ChromaDB...`);
        try {
            await (0, chromaUploader_1.addSchemesToChroma)(newDocs);
        }
        catch (err) {
            console.warn('ChromaDB upload failed; continuing without vector-store sync:', err);
        }
        saveProcessedSet(processed);
        console.log('\nDone. Restart the backend server (or it will pick up the updated CSV on next start) to make the new schemes available in chat.');
    }
    else {
        console.log('\nNo schemes were successfully added.');
    }
}
run().catch((err) => {
    console.error('PDF ingestion failed:', err);
    process.exit(1);
});
