"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const env_1 = require("../config/env");
const pdfLoader_1 = require("../ingestion/pdfLoader");
const pdfFieldExtractor_1 = require("../ingestion/pdfFieldExtractor");
const normalizer_1 = require("../ingestion/normalizer");
const csvAppender_1 = require("../ingestion/csvAppender");
const chromaUploader_1 = require("../ingestion/chromaUploader");
const dbService_1 = require("../services/dbService");
exports.adminRouter = (0, express_1.Router)();
const PDF_DIR = path_1.default.resolve(__dirname, '../../data/scheme_pdfs');
if (!fs_1.default.existsSync(PDF_DIR))
    fs_1.default.mkdirSync(PDF_DIR, { recursive: true });
const upload = (0, multer_1.default)({
    dest: PDF_DIR,
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB cap
    fileFilter: (_req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
            return cb(new Error('Only PDF files are accepted'));
        }
        cb(null, true);
    },
});
/**
 * POST /api/admin/upload-pdf
 * multipart/form-data, field name: "pdf"
 *
 * Lets you add a new scheme to the knowledge base at runtime by uploading
 * a single PDF — no server restart needed, no UI changes required.
 * Intended to be called from a dev tool (curl/Postman) or wired up to your
 * own admin screen later.
 */
exports.adminRouter.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No PDF file uploaded (field name must be "pdf")' });
    }
    const uploadedPath = req.file.path;
    // Give it a proper .pdf extension since multer's `dest` storage strips it
    const finalPath = `${uploadedPath}.pdf`;
    fs_1.default.renameSync(uploadedPath, finalPath);
    try {
        const { text, method } = await (0, pdfLoader_1.extractTextFromPdf)(finalPath);
        if (text.length < 30) {
            return res.status(422).json({ error: 'Could not extract usable text from this PDF, even after OCR.' });
        }
        const fallbackName = path_1.default.basename(req.file.originalname, '.pdf').replace(/[-_]/g, ' ');
        const fields = await (0, pdfFieldExtractor_1.extractSchemeFields)(text, fallbackName);
        const existing = (0, dbService_1.getAllSchemes)();
        const doc = (0, normalizer_1.normalizeRow)(fields, existing.length);
        (0, csvAppender_1.appendSchemeToCsv)(env_1.config.CSV_PATH, fields);
        (0, dbService_1.addSchemesToMemory)([doc]);
        await (0, chromaUploader_1.addSchemesToChroma)([doc]);
        return res.json({
            success: true,
            extractionMethod: method,
            scheme: {
                schemeId: doc.schemeId,
                schemeName: doc.schemeName,
                level: doc.level,
                category: doc.category,
                states: doc.states,
            },
        });
    }
    catch (err) {
        console.error('[adminRouter] PDF processing failed:', err);
        return res.status(500).json({ error: 'Failed to process PDF', details: err?.message });
    }
});
exports.default = exports.adminRouter;
