/**
 * schemeTranslator
 * ------------------------------------------------------------------------
 * Translates the free-text scheme fields (name, category, tags, benefits,
 * eligibility, documents, application) into Hindi so that recommendation
 * cards shown to a Hindi-mode citizen are not left in English.
 *
 * Design goals:
 *  - Uses the SAME Groq client/key already configured for report
 *    generation — no new paid service, no new API key required.
 *  - Every scheme's translation is computed AT MOST ONCE ever: the result
 *    is cached to a JSON file on disk (backend/data/scheme_translations_hi.json)
 *    and kept in memory for the lifetime of the process. Scheme text is
 *    static (it comes from the ingested CSV/PDFs), so this is safe and
 *    keeps ongoing Groq usage effectively free after the first run.
 *  - Fully non-blocking for the rest of the app: if GROQ_API_KEY is not
 *    configured, or the API call fails for any reason, we fall back to the
 *    original English text so the app keeps working end-to-end.
 */
import fs from 'fs';
import path from 'path';
import Groq from 'groq-sdk';
import { config } from '../config/env';
import { SchemeDocument } from '../ingestion/normalizer';

const CACHE_PATH = path.resolve(__dirname, '../../data/scheme_translations_hi.json');

export interface TranslatedSchemeFields {
  schemeName: string;
  category: string[];
  tags: string[];
  benefits: string;
  eligibilityText: string;
  documents: string;
  application: string;
}

type CacheShape = Record<string, TranslatedSchemeFields>;

let memoryCache: CacheShape = {};
let loadedFromDisk = false;

function loadCache(): CacheShape {
  if (loadedFromDisk) return memoryCache;
  loadedFromDisk = true;
  try {
    if (fs.existsSync(CACHE_PATH)) {
      memoryCache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
    }
  } catch (err) {
    console.warn('[SchemeTranslator] Could not read translation cache, starting fresh:', err);
    memoryCache = {};
  }
  return memoryCache;
}

// Fire-and-forget disk persistence — never block the request on a file write.
function persistCache() {
  try {
    fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
    fs.writeFile(CACHE_PATH, JSON.stringify(memoryCache, null, 2), (err) => {
      if (err) console.warn('[SchemeTranslator] Failed to persist translation cache:', err);
    });
  } catch (err) {
    console.warn('[SchemeTranslator] Failed to persist translation cache:', err);
  }
}

function englishFallback(scheme: SchemeDocument): TranslatedSchemeFields {
  return {
    schemeName: scheme.schemeName,
    category: scheme.category,
    tags: scheme.tags,
    benefits: scheme.benefits,
    eligibilityText: scheme.eligibility,
    documents: scheme.documents,
    application: scheme.application,
  };
}

/**
 * Returns the Hindi version of a scheme's display fields, translating and
 * caching on first request. Safe to call repeatedly / concurrently for the
 * same scheme — the in-flight promise is memoized so we never fire two
 * Groq calls for the same schemeId at once.
 */
const inFlight = new Map<string, Promise<TranslatedSchemeFields>>();

export async function translateSchemeToHindi(scheme: SchemeDocument): Promise<TranslatedSchemeFields> {
  const cache = loadCache();
  const cached = cache[scheme.schemeId];
  if (cached) return cached;

  if (!config.GROQ_API_KEY) {
    // No key configured — degrade gracefully to English rather than failing.
    return englishFallback(scheme);
  }

  const existing = inFlight.get(scheme.schemeId);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const groq = new Groq({ apiKey: config.GROQ_API_KEY });
      const payload = {
        schemeName: scheme.schemeName,
        category: scheme.category,
        tags: scheme.tags,
        benefits: scheme.benefits,
        eligibilityText: scheme.eligibility,
        documents: scheme.documents,
        application: scheme.application,
      };

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You translate Indian government welfare scheme descriptions from English to Hindi (Devanagari script) ' +
              'for citizens who are more comfortable reading Hindi. Keep the official scheme name recognisable ' +
              '(you may keep it in English or give "Hindi (English)" form — whichever is most commonly used). ' +
              'Do not invent, omit, or alter any facts, numbers, or amounts. Preserve line breaks/bullet structure. ' +
              'Respond ONLY with a JSON object with exactly these keys: schemeName (string), category (array of strings), ' +
              'tags (array of strings), benefits (string), eligibilityText (string), documents (string), application (string).',
          },
          { role: 'user', content: JSON.stringify(payload) },
        ],
      });

      const raw = response.choices[0]?.message?.content;
      if (!raw) throw new Error('Empty translation response');
      const parsed = JSON.parse(raw);

      const result: TranslatedSchemeFields = {
        schemeName: typeof parsed.schemeName === 'string' ? parsed.schemeName : scheme.schemeName,
        category: Array.isArray(parsed.category) ? parsed.category : scheme.category,
        tags: Array.isArray(parsed.tags) ? parsed.tags : scheme.tags,
        benefits: typeof parsed.benefits === 'string' ? parsed.benefits : scheme.benefits,
        eligibilityText: typeof parsed.eligibilityText === 'string' ? parsed.eligibilityText : scheme.eligibility,
        documents: typeof parsed.documents === 'string' ? parsed.documents : scheme.documents,
        application: typeof parsed.application === 'string' ? parsed.application : scheme.application,
      };

      memoryCache[scheme.schemeId] = result;
      persistCache();
      return result;
    } catch (err) {
      console.error(`[SchemeTranslator] Failed to translate scheme ${scheme.schemeId}, using English fallback:`, err);
      return englishFallback(scheme);
    } finally {
      inFlight.delete(scheme.schemeId);
    }
  })();

  inFlight.set(scheme.schemeId, promise);
  return promise;
}

export default translateSchemeToHindi;
