'use client';

import { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n/LanguageProvider';

interface CertDoc {
  id: string;
  type: string;
  title: string;
  fileUrl: string;
  isVerified: boolean;
  createdAt: string;
}

const MAX_BYTES = 5 * 1024 * 1024;

export default function CertificationDropzone({ initialDocs }: { initialDocs?: CertDoc[] }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<CertDoc[]>(initialDocs ?? []);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = (files: FileList | null) => {
    if (!files || !files.length) return;
    const file = files[0];
    if (file.size > MAX_BYTES) { setError('Fichier > 5 Mo ignoré.'); return; }
    setError('');
    setBusy(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = typeof e.target?.result === 'string' ? e.target.result : '';
      const title = file.name.replace(/\.[^.]+$/, '');
      const type = /iso.?14001/i.test(file.name) ? 'ISO_14001' : /b.?corp/i.test(file.name) ? 'B_CORP' : 'CERTIFICATION';
      try {
        const res = await api.addCertification({ type, title, fileUrl: dataUrl });
        const doc = res?.data?.document ?? res?.document;
        if (doc) setDocs((prev) => [doc, ...prev]);
      } catch (err) { console.error(err); setError('Échec de l\'envoi.'); }
      finally { setBusy(false); }
    };
    reader.readAsDataURL(file);
  };

  const remove = async (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
    try { await api.deleteCertification(id); } catch (e) { console.error(e); }
  };

  return (
    <div>
      <div
        className={`set-dropzone ${drag ? 'drag' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
      >
        <div style={{ fontSize: 30, marginBottom: 8 }}>📄</div>
        <p style={{ fontSize: 14, color: 'var(--set-text-dim)', marginBottom: 4 }}>
          {busy ? t('common.saving') : t('settings.profile.dropzone')}
        </p>
        <p style={{ fontSize: 12, color: 'var(--set-text-muted)' }}>{t('settings.profile.dropHint')}</p>
        <input ref={inputRef} type="file" accept="application/pdf,image/*" style={{ display: 'none' }} onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {error && <div style={{ marginTop: 10, fontSize: 12, color: '#f87171' }}>⚠ {error}</div>}

      {docs.length > 0 && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {docs.map((d) => (
            <div key={d.id} className="set-cert-item">
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16 }}>🏅</span>
                <span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--set-text)' }}>{d.title}</span>
                  <span style={{ fontSize: 11, color: 'var(--set-text-muted)', marginLeft: 8 }}>{d.type}</span>
                </span>
              </span>
              <button type="button" className="set-cert-remove" onClick={() => remove(d.id)} aria-label="Supprimer">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
