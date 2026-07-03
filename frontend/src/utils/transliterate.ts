import Sanscript from '@indic-transliteration/sanscript';
import { Language } from '../i18n/translations';

// Converts romanized text ("Hinglish"/"Kanglish") typed on a normal keyboard
// into the target Indic script, word by word. Numbers are left untouched so
// the backend's numeric extraction (age, income) keeps working on the
// result. This is a phonetic best-effort preview, not a dictionary lookup —
// the user can always accept it, edit it, or just send the Latin text as-is.

// Maps each transliteration-capable app language to its Sanscript output
// scheme. English is intentionally omitted — it never transliterates.
const SCRIPT_FOR_LANGUAGE: Partial<Record<Language, string>> = {
  hi: 'devanagari',
  kn: 'kannada',
};

export function supportsTransliteration(language: Language): boolean {
  return language in SCRIPT_FOR_LANGUAGE;
}

export function transliterateToScript(text: string, language: Language): string {
  const scheme = SCRIPT_FOR_LANGUAGE[language];
  if (!scheme) return text;
  return text
    .split(/(\s+)/)
    .map((token) => {
      if (/^\s+$/.test(token) || token === '') return token;
      if (/^\d+$/.test(token)) return token;
      return Sanscript.t(token, 'itrans', scheme, { syncope: true });
    })
    .join('');
}

// Backwards-compatible alias for existing call sites / Hindi-only usage.
export function transliterateToDevanagari(text: string): string {
  return transliterateToScript(text, 'hi');
}

// Quick check so we only bother running/showing transliteration for text
// that looks like romanized input, not text already typed in the target script.
export function looksLikeLatinScript(text: string): boolean {
  return /[a-zA-Z]/.test(text);
}
