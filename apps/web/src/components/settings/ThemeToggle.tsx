'use client';

import { useTheme } from '@/lib/theme/ThemeProvider';
import { useTranslation } from '@/lib/i18n/LanguageProvider';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  const options: { value: 'dark' | 'light'; label: string; icon: string }[] = [
    { value: 'dark', label: t('settings.appearance.dark'), icon: '🌙' },
    { value: 'light', label: t('settings.appearance.light'), icon: '☀️' },
  ];

  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {options.map((opt) => {
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            className={`set-choice ${active ? 'active' : ''}`}
          >
            <span style={{ fontSize: 18 }}>{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
