"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractSchemeFields = extractSchemeFields;
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const env_1 = require("../config/env");
const SYSTEM_PROMPT = `You are an information-extraction engine for an Indian government welfare scheme database.
You will be given raw text extracted from a scheme PDF (brochure, notification, or guideline).
Extract the following fields and return ONLY a single valid JSON object, no markdown, no commentary:

{
  "scheme_name": "official name of the scheme",
  "level": "Central" or "State",
  "schemeCategory": "comma separated categories e.g. Education, Health, Agriculture, Housing, Women & Child, Pension, Employment",
  "tags": "comma separated short keyword tags",
  "details": "2-4 sentence plain summary of what the scheme is",
  "benefits": "what the beneficiary gets, in plain text",
  "eligibility": "full eligibility criteria as plain text, keep exact numbers (income limits, age limits, etc.) if present",
  "application": "how to apply",
  "documents": "documents required, comma separated or plain text"
}

If a field is not present in the text, use an empty string for it. Never invent facts that are not in the source text.`;
async function extractSchemeFields(rawText, fallbackName) {
    const truncated = rawText.slice(0, 12000); // keep prompt small & fast
    if (env_1.config.GROQ_API_KEY) {
        try {
            const groq = new groq_sdk_1.default({ apiKey: env_1.config.GROQ_API_KEY });
            const response = await groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                temperature: 0.1,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: truncated },
                ],
            });
            const content = response.choices[0]?.message?.content || '';
            const jsonStr = stripCodeFences(content);
            const parsed = JSON.parse(jsonStr);
            return {
                scheme_name: parsed.scheme_name || fallbackName,
                slug: slugify(parsed.scheme_name || fallbackName),
                level: parsed.level || 'Central',
                schemeCategory: parsed.schemeCategory || '',
                tags: parsed.tags || '',
                details: parsed.details || '',
                benefits: parsed.benefits || '',
                eligibility: parsed.eligibility || '',
                application: parsed.application || '',
                documents: parsed.documents || '',
            };
        }
        catch (err) {
            console.warn('[pdfFieldExtractor] Groq extraction failed, using offline fallback:', err);
        }
    }
    else {
        console.log('[pdfFieldExtractor] GROQ_API_KEY not set, using offline regex-based fallback extraction.');
    }
    return regexFallbackExtraction(rawText, fallbackName);
}
function stripCodeFences(text) {
    return text
        .trim()
        .replace(/^```json/i, '')
        .replace(/^```/, '')
        .replace(/```$/, '')
        .trim();
}
function slugify(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 80);
}
/**
 * Offline fallback (no LLM call at all) used when GROQ_API_KEY is not configured,
 * or if the Groq call fails for any reason. Crude but keeps the pipeline 100%
 * functional without any external API, ever.
 */
function regexFallbackExtraction(rawText, fallbackName) {
    const cleaned = rawText.replace(/\s+/g, ' ').trim();
    const eligibilityMatch = cleaned.match(/eligibilit[a-z]*[:\-\s]+(.{0,800})/i);
    const benefitsMatch = cleaned.match(/benefit[a-z]*[:\-\s]+(.{0,500})/i);
    const applicationMatch = cleaned.match(/(?:how to apply|application process)[:\-\s]+(.{0,500})/i);
    const documentsMatch = cleaned.match(/document[a-z]*\s*required[:\-\s]+(.{0,400})/i);
    return {
        scheme_name: fallbackName,
        slug: slugify(fallbackName),
        level: 'Central',
        schemeCategory: '',
        tags: '',
        details: cleaned.slice(0, 500),
        benefits: benefitsMatch?.[1]?.trim() || '',
        eligibility: eligibilityMatch?.[1]?.trim() || '',
        application: applicationMatch?.[1]?.trim() || '',
        documents: documentsMatch?.[1]?.trim() || '',
    };
}
