'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n/LanguageProvider';

interface ApiKeyRow {
  id: string;
  label: string;
  masked: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export default function ApiKeysPanel() {
  const { t } = useTranslation();
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [label, setLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.listApiKeys();
      setKeys(res?.data ?? []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    if (!label.trim()) return;
    setCreating(true);
    try {
      const res = await api.createApiKey(label.trim());
      const full = res?.data?.key ?? res?.key;
      if (full) setNewKey(full);
      setLabel('');
      await load();
    } catch (e) { console.error(e); }
    finally { setCreating(false); }
  };

  const revoke = async (id: string) => {
    try { await api.revokeApiKey(id); await load(); } catch (e) { console.error(e); }
  };

  const copy = () => {
    if (!newKey) return;
    navigator.clipboard?.writeText(newKey).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          className="set-input"
          style={{ flex: 1, minWidth: 200 }}
          placeholder={t('settings.dev.newKeyLabel')}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <button type="button" className="set-btn-primary" onClick={generate} disabled={creating || !label.trim()}>
          {creating ? t('common.saving') : `＋ ${t('settings.dev.generate')}`}
        </button>
      </div>

      {newKey && (
        <div className="set-newkey">
          <div style={{ fontSize: 12, color: '#fbbf24', marginBottom: 8 }}>⚠ {t('settings.dev.keyOnce')}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <code style={{ flex: 1, fontSize: 13, color: '#34d399', wordBreak: 'break-all' }}>{newKey}</code>
            <button type="button" className="set-btn-ghost" onClick={copy}>{copied ? t('common.copied') : t('common.copy')}</button>
            <button type="button" className="set-btn-ghost" onClick={() => setNewKey(null)}>✕</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {keys.length === 0 && <div style={{ fontSize: 13, color: 'var(--set-text-muted)' }}>—</div>}
        {keys.map((k) => (
          <div key={k.id} className="set-key-row">
            <span style={{ minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--set-text)' }}>{k.label}</span>
              <code style={{ display: 'block', fontSize: 12, color: 'var(--set-text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>{k.masked}</code>
            </span>
            {k.revokedAt ? (
              <span className="set-badge-revoked">{t('common.revoked')}</span>
            ) : (
              <button type="button" className="set-btn-danger" onClick={() => revoke(k.id)}>{t('settings.dev.revoke')}</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
