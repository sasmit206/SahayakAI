"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTextFromPdf = extractTextFromPdf;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
/**
 * Extracts raw text from a PDF file.
 *
 * Strategy (fully offline, 100% free, no API calls):
 *  1. Try `pdf-parse` first — works for almost all official government
 *     scheme brochures/PDFs because they are digitally generated (not scans).
 *  2. If the extracted text is suspiciously short (a strong signal that the
 *     PDF is actually a scanned image), fall back to an OCR pipeline:
 *       a. Rasterize each page to a PNG using `pdf-poppler`
 *          (wraps the open-source `poppler-utils` system package).
 *       b. Run `tesseract.js` (open-source, runs locally, no API key,
 *          no usage limits) on each page image and concatenate the text.
 *
 * Both pdf-parse and tesseract.js are MIT-licensed npm packages with no
 * usage caps and no recurring cost — safe to rely on indefinitely.
 */
const MIN_TEXT_LENGTH_BEFORE_OCR = 200; // chars - below this we assume "scanned PDF"
async function extractTextFromPdf(filePath) {
    const buffer = fs_1.default.readFileSync(filePath);
    // --- Step 1: try native text extraction ---
    let nativeText = '';
    let pageCount = 0;
    try {
        // pdf-parse is CommonJS; require keeps this working under ts-node too.
        const pdfParse = require('pdf-parse');
        const result = await pdfParse(buffer);
        nativeText = (result.text || '').trim();
        pageCount = result.numpages || 0;
    }
    catch (err) {
        console.warn(`[pdfLoader] pdf-parse failed for ${filePath}:`, err);
    }
    if (nativeText.length >= MIN_TEXT_LENGTH_BEFORE_OCR) {
        return { text: nativeText, method: 'pdf-parse', pageCount };
    }
    // --- Step 2: OCR fallback for scanned / image-only PDFs ---
    console.log(`[pdfLoader] "${path_1.default.basename(filePath)}" looks like a scanned PDF (only ${nativeText.length} chars extracted). Running OCR fallback...`);
    try {
        const ocrText = await ocrPdf(filePath);
        const combined = [nativeText, ocrText].filter(Boolean).join('\n\n');
        return {
            text: combined,
            method: nativeText.length > 0 ? 'pdf-parse+ocr' : 'ocr',
            pageCount,
        };
    }
    catch (err) {
        console.error(`[pdfLoader] OCR fallback failed for ${filePath}:`, err);
        // Return whatever native text we have, even if short, rather than failing outright.
        return { text: nativeText, method: 'pdf-parse', pageCount };
    }
}
async function ocrPdf(filePath) {
    const poppler = require('pdf-poppler');
    const Tesseract = require('tesseract.js');
    const tmpDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'sahayak-ocr-'));
    const outPrefix = 'page';
    const opts = {
        format: 'png',
        out_dir: tmpDir,
        out_prefix: outPrefix,
        page: null, // all pages
    };
    await poppler.convert(filePath, opts);
    const pageImages = fs_1.default
        .readdirSync(tmpDir)
        .filter((f) => f.startsWith(outPrefix) && f.endsWith('.png'))
        .sort(); // page-1.png, page-2.png, ... (lexicographic is fine for <1000 pages)
    let fullText = '';
    for (const imgFile of pageImages) {
        const imgPath = path_1.default.join(tmpDir, imgFile);
        console.log(`[pdfLoader] OCR-ing ${imgFile}...`);
        const { data } = await Tesseract.recognize(imgPath, 'eng');
        fullText += `\n${data.text || ''}`;
    }
    // Cleanup temp files
    try {
        fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
    }
    catch {
        /* ignore cleanup errors */
    }
    return fullText.trim();
}
