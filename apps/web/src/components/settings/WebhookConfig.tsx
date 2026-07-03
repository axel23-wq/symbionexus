'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n/LanguageProvider';

export default function WebhookConfig({ initialUrl }: { initialUrl?: string | null }) {
  const { t } = useTranslation();
  const [url, setUrl] = useState(initialUrl ?? '');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const save = async () => {
    setStatus('saving');
    try {
      await api.updateWebhook(url.trim());
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (e) { console.error(e); setStatus('idle'); }
  };

  return (
    <div>
      <label className="set-label">{t('settings.dev.webhook')}</label>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input
          className="set-input"
          style={{ flex: 1, minWidth: 220 }}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://erp.example.cm/webhooks/symbionexus"
        />
        <button type="button" className="set-btn-primary" onClick={save} disabled={status === 'saving'}>
          {status === 'saving' ? t('common.saving') : status === 'saved' ? `✓ ${t('common.saved')}` : t('common.save')}
        </button>
      </div>
      <p style={{ fontSize: 12, color: 'var(--set-text-muted)', marginTop: 8 }}>{t('settings.dev.webhookHint')}</p>
    </div>
  );
}
