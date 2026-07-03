'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n/LanguageProvider';

interface CompanyData {
  name?: string;
  registrationNumber?: string | null;
  logoUrl?: string | null;
  description?: string | null;
  trustScore?: number;
}

export default function CompanyProfileForm({ company }: { company: CompanyData | null }) {
  const { t } = useTranslation();
  const [name, setName] = useState(company?.name ?? '');
  const [registrationNumber, setReg] = useState(company?.registrationNumber ?? '');
  const [logoUrl, setLogoUrl] = useState(company?.logoUrl ?? '');
  const [description, setDescription] = useState(company?.description ?? '');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const save = async () => {
    setStatus('saving');
    try {
      await api.updateCompanyProfile({ name, registrationNumber, logoUrl, description });
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (e) {
      console.error(e);
      setStatus('idle');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
      <div style={{ gridColumn: '1 / -1' }}>
        <label className="set-label">{t('settings.profile.companyName')}</label>
        <input className="set-input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className="set-label">{t('settings.profile.regNumber')}</label>
        <input className="set-input" value={registrationNumber} onChange={(e) => setReg(e.target.value)} placeholder="M08..." />
      </div>
      <div>
        <label className="set-label">{t('settings.profile.logo')}</label>
        <input className="set-input" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…" />
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <label className="set-label">{t('settings.profile.description')}</label>
        <textarea className="set-input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} style={{ resize: 'vertical' }} />
      </div>
      <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button type="button" className="set-btn-primary" onClick={save} disabled={status === 'saving'}>
          {status === 'saving' ? t('common.saving') : status === 'saved' ? `✓ ${t('common.saved')}` : t('common.save')}
        </button>
        {typeof company?.trustScore === 'number' && (
          <span style={{ fontSize: 12, color: 'var(--set-text-muted)' }}>
            Trust Score : <b style={{ color: '#10b981' }}>{Math.round(company.trustScore * 100)}%</b>
          </span>
        )}
      </div>
    </div>
  );
}
