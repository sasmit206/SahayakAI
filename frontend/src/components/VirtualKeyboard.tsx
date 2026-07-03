import React from 'react';
import { motion } from 'framer-motion';
import { Delete, X } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { Language } from '../i18n/translations';

interface VirtualKeyboardProps {
  language: 'hi' | 'kn';
  onKey: (char: string) => void;
  onBackspace: () => void;
  onSpace: () => void;
  onClear: () => void;
  onClose: () => void;
}

// Grouped by row the way most phonetic keyboards present them: vowels, then
// consonants in traditional varnamala order, then matras (vowel signs) and
// digits a citizen is likely to need. Devanagari and Kannada share the same
// underlying Brahmic layout shape, so both are laid out identically row-for-row.
const LAYOUTS: Record<'hi' | 'kn', {
  vowels: string[];
  consonantRows: string[][];
  matras: string[];
  digits: string[];
}> = {
  hi: {
    vowels: ['अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ए', 'ऐ', 'ओ', 'औ', 'अं', 'अः'],
    consonantRows: [
      ['क', 'ख', 'ग', 'घ', 'ङ', 'च', 'छ', 'ज', 'झ', 'ञ'],
      ['ट', 'ठ', 'ड', 'ढ', 'ण', 'त', 'थ', 'द', 'ध', 'न'],
      ['प', 'फ', 'ब', 'भ', 'म', 'य', 'र', 'ल', 'व'],
      ['श', 'ष', 'स', 'ह', 'क्ष', 'त्र', 'ज्ञ', '़', 'ँ'],
    ],
    matras: ['ा', 'ि', 'ी', 'ु', 'ू', 'े', 'ै', 'ो', 'ौ', 'ं', '्', 'ृ'],
    digits: ['१', '२', '३', '४', '५', '६', '७', '८', '९', '०'],
  },
  kn: {
    vowels: ['ಅ', 'ಆ', 'ಇ', 'ಈ', 'ಉ', 'ಊ', 'ಎ', 'ಏ', 'ಐ', 'ಒ', 'ಓ', 'ಔ', 'ಅಂ', 'ಅಃ'],
    consonantRows: [
      ['ಕ', 'ಖ', 'ಗ', 'ಘ', 'ಙ', 'ಚ', 'ಛ', 'ಜ', 'ಝ', 'ಞ'],
      ['ಟ', 'ಠ', 'ಡ', 'ಢ', 'ಣ', 'ತ', 'ಥ', 'ದ', 'ಧ', 'ನ'],
      ['ಪ', 'ಫ', 'ಬ', 'ಭ', 'ಮ', 'ಯ', 'ರ', 'ಲ', 'ವ'],
      ['ಶ', 'ಷ', 'ಸ', 'ಹ', 'ಳ', 'ಕ್ಷ', 'ಜ್ಞ'],
    ],
    matras: ['ಾ', 'ಿ', 'ೀ', 'ು', 'ೂ', 'ೆ', 'ೇ', 'ೈ', 'ೊ', 'ೋ', 'ೌ', 'ಂ', '್', 'ೃ'],
    digits: ['೧', '೨', '೩', '೪', '೫', '೬', '೭', '೮', '೯', '೦'],
  },
};

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  language, onKey, onBackspace, onSpace, onClear, onClose,
}) => {
  const { t } = useLang();
  const layout = LAYOUTS[language];

  const Key: React.FC<{ ch: string }> = ({ ch }) => (
    <motion.button
      type="button"
      onClick={() => onKey(ch)}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      className="h-8 min-w-[32px] px-1.5 rounded-md bg-ink-850 border border-white/[0.08] text-white text-[14px] hover:border-accent/40 hover:bg-ink-800 transition-colors"
    >
      {ch}
    </motion.button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="mb-2 p-3 rounded-lg bg-ink-900 border border-white/[0.08] space-y-1.5"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10.5px] uppercase tracking-[0.1em] text-ink-400">{t.keyboardToggle}</span>
        <button type="button" onClick={onClose} className="text-ink-400 hover:text-white p-0.5">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1">{layout.vowels.map((c) => <Key key={c} ch={c} />)}</div>
      {layout.consonantRows.map((row, i) => (
        <div key={i} className="flex flex-wrap gap-1">{row.map((c) => <Key key={c} ch={c} />)}</div>
      ))}
      <div className="h-px bg-white/[0.06] my-1" />
      <div className="flex flex-wrap gap-1">{layout.matras.map((c) => <Key key={c} ch={c} />)}</div>
      <div className="flex flex-wrap gap-1">{layout.digits.map((c) => <Key key={c} ch={c} />)}</div>

      <div className="flex items-center gap-1.5 pt-1.5">
        <motion.button
          type="button"
          onClick={onSpace}
          whileTap={{ scale: 0.96 }}
          className="flex-1 h-8 rounded-md bg-ink-850 border border-white/[0.08] text-ink-200 text-[12px] hover:border-white/[0.16]"
        >
          {t.keyboardSpace}
        </motion.button>
        <motion.button
          type="button"
          onClick={onBackspace}
          whileTap={{ scale: 0.96 }}
          className="h-8 px-3 rounded-md bg-ink-850 border border-white/[0.08] text-ink-200 hover:border-white/[0.16] flex items-center gap-1.5 text-[12px]"
          title={t.keyboardBackspace}
        >
          <Delete className="h-3.5 w-3.5" />
        </motion.button>
        <motion.button
          type="button"
          onClick={onClear}
          whileTap={{ scale: 0.96 }}
          className="h-8 px-3 rounded-md bg-ink-850 border border-white/[0.08] text-ink-200 hover:border-danger/40 hover:text-danger text-[12px]"
        >
          {t.keyboardClear}
        </motion.button>
      </div>
    </motion.div>
  );
};

// Helper for callers that only have a generic app Language and want to know
// whether a virtual keyboard is available for it.
export function supportsVirtualKeyboard(language: Language): language is 'hi' | 'kn' {
  return language === 'hi' || language === 'kn';
}

export default VirtualKeyboard;
