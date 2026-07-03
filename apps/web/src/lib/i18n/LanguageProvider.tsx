'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { LANGUAGES, DEFAULT_LOCALE, STORAGE_KEY, type Locale } from './config';
import fr from './messages/fr.json';
import en from './messages/en.json';
import es from './messages/es.json';
import de from './messages/de.json';
import it from './messages/it.json';
import pt from './messages/pt.json';
import nl from './messages/nl.json';
import ar from './messages/ar.json';
import zh from './messages/zh.json';
import sw from './messages/sw.json';

type Dict = Record<string, string>;
const DICTS: Record<Locale, Dict> = { fr, en, es, de, it, pt, nl, ar, zh, sw };

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function LanguageProvider({ children, initialLocale }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (stored && DICTS[stored]) return stored;
    }
    return initialLocale && DICTS[initialLocale] ? initialLocale : DEFAULT_LOCALE;
  });

  useEffect(() => {
    document.documentElement.lang = locale;
    const rtl = LANGUAGES.find((l) => l.code === locale)?.rtl;
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    if (!DICTS[l]) return;
    setLocaleState(l);
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, l);
    // Persistance serveur (best-effort, ne bloque pas l'UI)
    import('@/lib/api').then(({ api }) => api.updatePreferences({ locale: l }).catch(() => {}));
  }, []);

  const t = useCallback(
    (key: string) => DICTS[locale]?.[key] ?? DICTS[DEFAULT_LOCALE]?.[key] ?? key,
    [locale],
  );

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (ctx) return ctx;
  // Fallback sûr hors provider
  return {
    locale: DEFAULT_LOCALE,
    setLocale: () => {},
    t: (key: string) => DICTS[DEFAULT_LOCALE]?.[key] ?? key,
  };
}
