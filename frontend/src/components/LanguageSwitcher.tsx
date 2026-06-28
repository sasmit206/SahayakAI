/**
 * LanguageSwitcher
 * Toggle button placed in the app header. Switches between EN and HI.
 * Extends easily — just add entries to the `LANGS` array.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { useLang } from '../context/LanguageContext';
import { Language } from '../i18n/translations';

const LANGS: { code: Language; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'EN' },
  { code: 'hi', label: 'हिंदी',   native: 'HI' },
];

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLang();

  return (
    <div
      className="flex items-center rounded-lg border border-white/[0.08] bg-ink-850 p-0.5 gap-0.5"
      role="group"
      aria-label="Select language"
    >
      {LANGS.map(({ code, native, label }) => (
        <motion.button
          key={code}
          onClick={() => setLanguage(code)}
          whileTap={{ scale: 0.94 }}
          aria-pressed={language === code}
          aria-label={label}
          className={`relative px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide transition-colors duration-150 ${
            language === code
              ? 'bg-white text-ink-950'
              : 'text-ink-400 hover:text-white'
          }`}
        >
          {native}
        </motion.button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
