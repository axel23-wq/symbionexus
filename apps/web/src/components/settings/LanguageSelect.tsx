'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import { LANGUAGES } from '@/lib/i18n/config';

export default function LanguageSelect() {
  const { locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', maxWidth: 320 }}>
      <button type="button" className="set-select" onClick={() => setOpen((v) => !v)}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>{current.flag}</span>
          <span>{current.nativeName}</span>
        </span>
        <span style={{ color: 'var(--set-text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
      </button>

      {open && (
        <div className="set-dropdown">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              className={`set-dropdown-item ${l.code === locale ? 'active' : ''}`}
              onClick={() => { setLocale(l.code); setOpen(false); }}
            >
              <span style={{ fontSize: 18 }}>{l.flag}</span>
              <span style={{ flex: 1, textAlign: 'left' }}>{l.nativeName}</span>
              {l.code === locale && <span style={{ color: '#10b981' }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
