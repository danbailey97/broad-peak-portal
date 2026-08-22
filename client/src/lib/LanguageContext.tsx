import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Lang } from './i18n';
import { t as translate, type TranslationKey } from './i18n';

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
  dir: 'ltr' | 'rtl';
  isAr: boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (k) => k,
  dir: 'ltr',
  isAr: false,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  const setLang = (l: Lang) => {
    setLangState(l);
    // Apply RTL to document root immediately
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = l;
    // Apply Arabic font for AR
    if (l === 'ar') {
      document.documentElement.style.fontFamily = "'Cairo', 'Segoe UI', sans-serif";
    } else {
      document.documentElement.style.fontFamily = '';
    }
  };

  return (
    <LanguageContext.Provider value={{
      lang,
      setLang,
      t: (key: TranslationKey) => translate(lang, key),
      dir: lang === 'ar' ? 'rtl' : 'ltr',
      isAr: lang === 'ar',
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}

/** Toggle button component — renders EN/AR pill */
export function LangToggle({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
      title={lang === 'en' ? 'Switch to Arabic' : 'Switch to English'}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all select-none ${className}`}
      style={{
        background: 'rgba(255,255,255,0.15)',
        border: '1px solid rgba(255,255,255,0.30)',
        color: '#fff',
        backdropFilter: 'blur(8px)',
        letterSpacing: '0.03em',
      }}
    >
      <span style={{ opacity: lang === 'en' ? 1 : 0.5 }}>EN</span>
      <span style={{ opacity: 0.4 }}>|</span>
      <span style={{ opacity: lang === 'ar' ? 1 : 0.5, fontFamily: "'Cairo', sans-serif" }}>عربي</span>
    </button>
  );
}

/** Same toggle but styled for the white header bar */
export function LangToggleDark({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
      title={lang === 'en' ? 'Switch to Arabic' : 'Switch to English'}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all select-none ${className}`}
      style={{
        background: '#f3f4f6',
        border: '1px solid #e5e7eb',
        color: '#374151',
        letterSpacing: '0.03em',
      }}
    >
      <span style={{ opacity: lang === 'en' ? 1 : 0.45 }}>EN</span>
      <span style={{ opacity: 0.35 }}>|</span>
      <span style={{ opacity: lang === 'ar' ? 1 : 0.45, fontFamily: "'Cairo', sans-serif" }}>عربي</span>
    </button>
  );
}
