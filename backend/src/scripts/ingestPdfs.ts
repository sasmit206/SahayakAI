import fs from 'fs';
import path from 'path';
import { config } from '../config/env';
import { extractTextFromPdf } from '../ingestion/pdfLoader';
import { extractSchemeFields } from '../ingestion/pdfFieldExtractor';
import { normalizeRow, SchemeDocument } from '../ingestion/normalizer';
import { appendSchemeToCsv } from '../ingestion/csvAppender';
import { addSchemesToChroma } from '../ingestion/chromaUploader';
import { loadSchemes } from '../ingestion/csvLoader';

const PDF_DIR = path.resolve(__dirname, '../../data/scheme_pdfs');
const PROCESSED_LOG = path.resolve(__dirname, '../../data/scheme_pdfs/.processed.json');

function loadProcessedSet(): Set<string> {
  if (!fs.existsSync(PROCESSED_LOG)) return new Set();
  try {
    const arr = JSON.parse(fs.readFileSync(PROCESSED_LOG, 'utf-8'));
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function saveProcessedSet(set: Set<string>) {
  fs.writeFileSync(PROCESSED_LOG, JSON.stringify(Array.from(set), null, 2), 'utf-8');
}

async function run() {
  console.log('--- Sahayak AI: PDF Scheme Ingestion ---');

  if (!fs.existsSync(PDF_DIR)) {
    fs.mkdirSync(PDF_DIR, { recursive: true });
    console.log(`Created folder ${PDF_DIR}. Drop scheme PDFs there and re-run this script.`);
    return;
  }

  const processed = loadProcessedSet();
  const pdfFiles = fs
    .readdirSync(PDF_DIR)
    .filter((f) => f.toLowerCase().endsWith('.pdf') && !processed.has(f));

  if (pdfFiles.length === 0) {
    console.log('No new PDF files found in data/scheme_pdfs/. Nothing to do.');
    return;
  }

  console.log(`Found ${pdfFiles.length} new PDF(s) to process.`);

  // Figure out a safe starting index so new schemeIds/slugs don't collide
  // with the existing CSV-loaded schemes.
  const existingSchemes = await loadSchemes(config.CSV_PATH);
  let index = existingSchemes.length;

  const newDocs: SchemeDocument[] = [];

  for (const file of pdfFiles) {
    const filePath = path.join(PDF_DIR, file);
    console.log(`\nProcessing: ${file}`);

    try {
      const { text, method } = await extractTextFromPdf(filePath);
      console.log(`  Extracted ${text.length} chars via ${method}.`);

      if (text.length < 30) {
        console.warn(`  Skipping ${file}: extracted text too short to be useful.`);
        continue;
      }

      const fallbackName = path.basename(file, '.pdf').replace(/[-_]/g, ' ');
      const fields = await extractSchemeFields(text, fallbackName);

      const doc = normalizeRow(fields as any, index++);
      newDocs.push(doc);

      appendSchemeToCsv(config.CSV_PATH, fields);
      processed.add(file);

      console.log(`  ✓ Added scheme: "${doc.schemeName}" (${doc.schemeId})`);
    } catch (err) {
      console.error(`  ✗ Failed to process ${file}:`, err);
    }
  }

  if (newDocs.length > 0) {
    console.log(`\nUploading ${newDocs.length} new scheme(s) to ChromaDB...`);
    await addSchemesToChroma(newDocs);
    saveProcessedSet(processed);
    console.log('\nDone. Restart the backend server (or it will pick up the updated CSV on next start) to make the new schemes available in chat.');
  } else {
    console.log('\nNo schemes were successfully added.');
  }
}

run().catch((err) => {
  console.error('PDF ingestion failed:', err);
  process.exit(1);
});
