'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n/LanguageProvider';

type PrefKey = 'negotiation' | 'contract' | 'aiMatch' | 'delivery' | 'messages';

const DEFAULT_PREFS: Record<PrefKey, boolean> = {
  negotiation: true,
  contract: true,
  aiMatch: true,
  delivery: true,
  messages: false,
};

export default function NotificationToggles({ initial }: { initial?: Record<string, boolean> | null }) {
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState<Record<PrefKey, boolean>>({ ...DEFAULT_PREFS, ...(initial ?? {}) });
  const [saving, setSaving] = useState(false);

  const toggle = async (key: PrefKey) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSaving(true);
    try { await api.updateNotifications(next); } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const rows: { key: PrefKey; labelKey: string; icon: string }[] = [
    { key: 'negotiation', labelKey: 'settings.notif.negotiation', icon: '💬' },
    { key: 'contract', labelKey: 'settings.notif.contract', icon: '✍️' },
    { key: 'aiMatch', labelKey: 'settings.notif.aiMatch', icon: '🤖' },
    { key: 'delivery', labelKey: 'settings.notif.delivery', icon: '🚛' },
    { key: 'messages', labelKey: 'settings.notif.messages', icon: '📨' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {rows.map((r) => (
        <div key={r.key} className="set-toggle-row">
          <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 18 }}>{r.icon}</span>
            <span style={{ fontSize: 14, color: 'var(--set-text)' }}>{t(r.labelKey)}</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={prefs[r.key]}
            onClick={() => toggle(r.key)}
            className={`set-switch ${prefs[r.key] ? 'on' : ''}`}
          >
            <span className="set-switch-knob" />
          </button>
        </div>
      ))}
      <div style={{ fontSize: 11, color: 'var(--set-text-muted)', marginTop: 6, height: 14 }}>
        {saving ? t('common.saving') : ''}
      </div>
    </div>
  );
}
