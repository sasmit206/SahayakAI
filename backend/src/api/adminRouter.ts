import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env';
import { extractTextFromPdf } from '../ingestion/pdfLoader';
import { extractSchemeFields } from '../ingestion/pdfFieldExtractor';
import { normalizeRow } from '../ingestion/normalizer';
import { appendSchemeToCsv } from '../ingestion/csvAppender';
import { addSchemesToChroma } from '../ingestion/chromaUploader';
import { addSchemesToMemory, getAllSchemes } from '../services/dbService';

export const adminRouter = Router();

const PDF_DIR = path.resolve(__dirname, '../../data/scheme_pdfs');
if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true });

const upload = multer({
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
adminRouter.post('/upload-pdf', upload.single('pdf'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file uploaded (field name must be "pdf")' });
  }

  const uploadedPath = req.file.path;
  // Give it a proper .pdf extension since multer's `dest` storage strips it
  const finalPath = `${uploadedPath}.pdf`;
  fs.renameSync(uploadedPath, finalPath);

  try {
    const { text, method } = await extractTextFromPdf(finalPath);

    if (text.length < 30) {
      return res.status(422).json({ error: 'Could not extract usable text from this PDF, even after OCR.' });
    }

    const fallbackName = path.basename(req.file.originalname, '.pdf').replace(/[-_]/g, ' ');
    const fields = await extractSchemeFields(text, fallbackName);

    const existing = getAllSchemes();
    const doc = normalizeRow(fields as any, existing.length);

    appendSchemeToCsv(config.CSV_PATH, fields);
    addSchemesToMemory([doc]);
    await addSchemesToChroma([doc]);

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
  } catch (err: any) {
    console.error('[adminRouter] PDF processing failed:', err);
    return res.status(500).json({ error: 'Failed to process PDF', details: err?.message });
  }
});

export default adminRouter;
