import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env';
import { extractTextFromPdf } from '../ingestion/pdfLoader';
import { extractSchemeFields } from '../ingestion/pdfFieldExtractor';
import { normalizeRow } from '../ingestion/normalizer';
import { appendSchemeToCsv } from '../ingestion/csvAppender';
import { addSchemesToChroma, uploadToChroma } from '../ingestion/chromaUploader';
import { addSchemesToMemory, getAllSchemes } from '../services/dbService';
import { loadSchemes } from '../ingestion/csvLoader';

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

/**
 * POST /api/admin/ingest
 *
 * Exposes ingestion as an HTTP POST endpoint so it can be triggered on 
 * platforms like Render Free Tier where SSH shell access is disabled.
 */
adminRouter.post('/ingest', async (req: Request, res: Response) => {
  const limitStr = req.query.limit || req.body.limit;
  let limit = limitStr ? parseInt(limitStr as string, 10) : -1;

  try {
    console.log('[adminRouter] Starting triggered CSV ingestion...');
    const allSchemes = await loadSchemes(config.CSV_PATH);
    
    let schemesToIngest = allSchemes;
    if (limit > 0 && limit < allSchemes.length) {
      console.log(`[adminRouter] Limiting ingestion to first ${limit} schemes.`);
      schemesToIngest = allSchemes.slice(0, limit);
    } else {
      console.log(`[adminRouter] Ingesting all ${allSchemes.length} schemes.`);
    }

    await uploadToChroma(schemesToIngest);
    console.log('[adminRouter] Triggered CSV ingestion completed successfully.');
    
    return res.json({
      success: true,
      message: `Successfully ingested ${schemesToIngest.length} schemes into ChromaDB.`
    });
  } catch (err: any) {
    console.error('[adminRouter] Triggered CSV Ingestion failed:', err);
    return res.status(500).json({ error: 'Ingestion failed', details: err?.message });
  }
});

export default adminRouter;
