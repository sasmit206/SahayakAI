/**
 * LanguageContext
 * Provides the active language and translation helper throughout the app.
 * Language preference is persisted in localStorage so it survives page reloads.
 */
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Language, Translations, translations } from '../i18n/translations';

const STORAGE_KEY = 'sahayak_lang';

interface LanguageContextValue {
  language: Language;
  t: Translations;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored === 'hi' || stored === 'kn' || stored === 'en') ? stored : 'en';
  });

  const setLanguage = useCallback((lang: Language) => {
    localStorage.setItem(STORAGE_KEY, lang);
    setLanguageState(lang);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, t: translations[language], setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

/** Hook to consume language context anywhere in the tree */
export const useLang = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside <LanguageProvider>');
  return ctx;
};
