export type Locale = 'fr' | 'en' | 'es' | 'de' | 'it' | 'pt' | 'nl' | 'ar' | 'zh' | 'sw';

export interface LanguageOption {
  code: Locale;
  nativeName: string;
  flag: string;
  rtl?: boolean;
}

// 10 langues — nom affiché dans leur graphie native
export const LANGUAGES: LanguageOption[] = [
  { code: 'fr', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'en', nativeName: 'English', flag: '🇬🇧' },
  { code: 'es', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'de', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'nl', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'ar', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'zh', nativeName: '中文', flag: '🇨🇳' },
  { code: 'sw', nativeName: 'Kiswahili', flag: '🇰🇪' },
];

export const DEFAULT_LOCALE: Locale = 'fr';
export const STORAGE_KEY = 'symbio_locale';
