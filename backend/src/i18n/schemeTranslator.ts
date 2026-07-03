/**
 * schemeTranslator
 * ------------------------------------------------------------------------
 * Translates the free-text scheme fields (name, category, tags, benefits,
 * eligibility, documents, application) into the citizen's chosen language
 * (Hindi or Kannada) so that recommendation cards are never left in
 * English for a non-English session.
 *
 * Design goals:
 *  - Uses the SAME Groq client/key already configured for report
 *    generation — no new paid service, no new API key required.
 *  - Every scheme's translation is computed AT MOST ONCE per language: the
 *    result is cached to a JSON file on disk
 *    (backend/data/scheme_translations_<lang>.json) and kept in memory for
 *    the lifetime of the process. Scheme text is static (it comes from the
 *    ingested CSV/PDFs), so this is safe and keeps ongoing Groq usage
 *    effectively free after the first run.
 *  - Fully non-blocking for the rest of the app: if GROQ_API_KEY is not
 *    configured, or the API call fails for any reason, we fall back to the
 *    original English text so the app keeps working end-to-end.
 */
import fs from 'fs';
import path from 'path';
import Groq from 'groq-sdk';
import { config } from '../config/env';
import { SchemeDocument } from '../ingestion/normalizer';
import { Lang, LANGUAGE_NAME } from './botStrings';

// Languages that require translation (i.e. everything except English).
type TranslatableLang = Exclude<Lang, 'en'>;

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

const memoryCache: Record<TranslatableLang, CacheShape> = { hi: {}, kn: {} };
const loadedFromDisk: Record<TranslatableLang, boolean> = { hi: false, kn: false };

function cachePath(lang: TranslatableLang): string {
  return path.resolve(__dirname, `../../data/scheme_translations_${lang}.json`);
}

function loadCache(lang: TranslatableLang): CacheShape {
  if (loadedFromDisk[lang]) return memoryCache[lang];
  loadedFromDisk[lang] = true;
  try {
    const p = cachePath(lang);
    if (fs.existsSync(p)) {
      memoryCache[lang] = JSON.parse(fs.readFileSync(p, 'utf-8'));
    }
  } catch (err) {
    console.warn(`[SchemeTranslator] Could not read ${lang} translation cache, starting fresh:`, err);
    memoryCache[lang] = {};
  }
  return memoryCache[lang];
}

// Fire-and-forget disk persistence — never block the request on a file write.
function persistCache(lang: TranslatableLang) {
  try {
    const p = cachePath(lang);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFile(p, JSON.stringify(memoryCache[lang], null, 2), (err) => {
      if (err) console.warn(`[SchemeTranslator] Failed to persist ${lang} translation cache:`, err);
    });
  } catch (err) {
    console.warn(`[SchemeTranslator] Failed to persist ${lang} translation cache:`, err);
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

const SCRIPT_INSTRUCTION: Record<TranslatableLang, string> = {
  hi: 'Devanagari script',
  kn: 'Kannada script (ಕನ್ನಡ ಲಿಪಿ)',
};

/**
 * Returns the translated version of a scheme's display fields for the
 * given non-English language, translating and caching on first request.
 * Safe to call repeatedly / concurrently for the same scheme+language pair
 * — the in-flight promise is memoized so we never fire two Groq calls for
 * the same schemeId+language at once.
 */
const inFlight = new Map<string, Promise<TranslatedSchemeFields>>();

export async function translateScheme(scheme: SchemeDocument, lang: TranslatableLang): Promise<TranslatedSchemeFields> {
  const cache = loadCache(lang);
  const cached = cache[scheme.schemeId];
  if (cached) return cached;

  if (!config.GROQ_API_KEY) {
    // No key configured — degrade gracefully to English rather than failing.
    return englishFallback(scheme);
  }

  const inFlightKey = `${lang}:${scheme.schemeId}`;
  const existing = inFlight.get(inFlightKey);
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

      const languageName = LANGUAGE_NAME[lang];
      const scriptInstruction = SCRIPT_INSTRUCTION[lang];

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              `You translate Indian government welfare scheme descriptions from English to ${languageName} (${scriptInstruction}) ` +
              `for citizens who are more comfortable reading ${languageName}. Keep the official scheme name recognisable ` +
              `(you may keep it in English or give "${languageName} (English)" form — whichever is most commonly used). ` +
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

      memoryCache[lang][scheme.schemeId] = result;
      persistCache(lang);
      return result;
    } catch (err) {
      console.error(`[SchemeTranslator] Failed to translate scheme ${scheme.schemeId} to ${lang}, using English fallback:`, err);
      return englishFallback(scheme);
    } finally {
      inFlight.delete(inFlightKey);
    }
  })();

  inFlight.set(inFlightKey, promise);
  return promise;
}

// Backwards-compatible alias used by any older call sites.
export async function translateSchemeToHindi(scheme: SchemeDocument): Promise<TranslatedSchemeFields> {
  return translateScheme(scheme, 'hi');
}

export default translateScheme;
