import Sanscript from '@indic-transliteration/sanscript';

// Converts romanized Hindi ("Hinglish") typed on a normal keyboard into
// Devanagari script, word by word. Numbers are left untouched so the
// backend's numeric extraction (age, income) keeps working on the result.
// This is a phonetic best-effort preview, not a dictionary lookup — the
// user can always accept it, edit it, or just send the Latin text as-is.
export function transliterateToDevanagari(text: string): string {
  return text
    .split(/(\s+)/)
    .map((token) => {
      if (/^\s+$/.test(token) || token === '') return token;
      if (/^\d+$/.test(token)) return token;
      return Sanscript.t(token, 'itrans', 'devanagari', { syncope: true });
    })
    .join('');
}

// Quick check so we only bother running/showing transliteration for text
// that looks like romanized input, not text already typed in Devanagari.
export function looksLikeLatinScript(text: string): boolean {
  return /[a-zA-Z]/.test(text);
}
