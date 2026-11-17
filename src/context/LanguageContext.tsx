'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { it, type Dictionary } from '@/locales/it';
import { en } from '@/locales/en';
import { getCookie, setCookie } from '@/lib/evoUtils';

export type Language = 'it' | 'en';

interface LanguageContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  t: Dictionary;
  dict: Dictionary;
}

const dictionaries: Record<Language, Dictionary> = { it, en };

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'it',
  setLang: () => {},
  t: it,
  dict: it,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('it');

  useEffect(() => {
    const saved = getCookie('evo_lang');
    if (saved === 'en' || saved === 'it') {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    setCookie('evo_lang', newLang, 365);
  };

  const currentDict = dictionaries[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: currentDict, dict: currentDict }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="inline-flex items-center bg-[#0b0d11] border border-gray-800 rounded-md p-0.5 text-[11px] font-bold">
      <button
        type="button"
        onClick={() => setLang('it')}
        className={`px-2 py-1 rounded transition ${
          lang === 'it' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
        }`}
      >
        IT
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`px-2 py-1 rounded transition ${
          lang === 'en' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
        }`}
      >
        EN
      </button>
    </div>
  );
}
