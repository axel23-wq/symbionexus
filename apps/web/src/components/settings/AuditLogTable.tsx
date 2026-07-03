'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n/LanguageProvider';

interface AuditRow {
  id: string;
  action: string;
  ipAddress: string | null;
  status: 'SUCCESS' | 'FAILURE';
  createdAt: string;
}

const ACTION_LABEL: Record<string, string> = {
  LOGIN: 'Connexion',
  API_KEY_CREATED: 'Clé API générée',
  API_KEY_REVOKED: 'Clé API révoquée',
  CONTRACT_SIGNED: 'Signature de contrat',
};

export default function AuditLogTable() {
  const { t, locale } = useTranslation();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.getAuditLog();
      setRows(res?.data ?? []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const fmtDate = (iso: string) => {
    try { return new Date(iso).toLocaleString(locale === 'fr' ? 'fr-FR' : locale); }
    catch { return iso; }
  };

  return (
    <div className="set-table-wrap">
      <table className="set-table">
        <thead>
          <tr>
            <th>{t('settings.security.action')}</th>
            <th>{t('settings.security.date')}</th>
            <th>{t('settings.security.ip')}</th>
            <th style={{ textAlign: 'right' }}>{t('settings.security.status')}</th>
          </tr>
        </thead>
        <tbody>
          {!loading && rows.length === 0 && (
            <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--set-text-muted)' }}>{t('settings.security.empty')}</td></tr>
          )}
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={{ fontWeight: 600, color: 'var(--set-text)' }}>{ACTION_LABEL[r.action] ?? r.action}</td>
              <td style={{ color: 'var(--set-text-dim)' }}>{fmtDate(r.createdAt)}</td>
              <td><code style={{ fontSize: 12, color: 'var(--set-text-muted)' }}>{r.ipAddress ?? '—'}</code></td>
              <td style={{ textAlign: 'right' }}>
                <span className={r.status === 'SUCCESS' ? 'set-badge-ok' : 'set-badge-fail'}>
                  {r.status === 'SUCCESS' ? t('common.success') : t('common.failure')}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
