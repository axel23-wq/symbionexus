'use client';

import { use, useEffect, useState } from 'react';
import { api } from '@/lib/api';

const STATUS_LABELS: Record<string, string> = {
  CREATED: 'Passeport créé',
  PICKED_UP: 'Matière enlevée',
  IN_TRANSIT: 'En transit',
  NEAR_DESTINATION: 'En approche',
  DELIVERED: 'Livré sur site',
  CONFIRMED: 'Réception confirmée',
};

export default function VerifyPassportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [passport, setPassport] = useState<any>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    api.getPassport(id)
      .then((res) => { setPassport(res?.data ?? null); setState(res?.data ? 'ok' : 'error'); })
      .catch(() => setState('error'));
  }, [id]);

  const listing = passport?.contract?.match?.listing;
  const seller = passport?.contract?.sellerCompany;
  const buyer = passport?.contract?.buyerCompany;
  const carbon = passport?.carbonCredit;

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, #0f1b3d, #04080f 70%)', color: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 26 }}>🌿</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#2dd4bf' }}>SymbioNexus</span>
        </div>

        {state === 'loading' && (
          <div style={{ textAlign: 'center', color: '#64748b' }}>Vérification en cours…</div>
        )}

        {state === 'error' && (
          <div style={{ background: '#0f1729', border: '1.5px solid rgba(239,68,68,0.4)', borderRadius: 18, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>⚠️</div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#f87171', marginBottom: 6 }}>Passeport introuvable</h1>
            <p style={{ fontSize: 13, color: '#94a3b8' }}>Ce passeport n&apos;existe pas ou n&apos;est pas valide.</p>
          </div>
        )}

        {state === 'ok' && passport && (
          <div style={{ background: '#0f1729', border: '1.5px solid #1a2540', borderRadius: 18, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ background: 'linear-gradient(135deg,#0d9488,#10b981)', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>✓</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Passeport authentique</div>
                <div style={{ fontSize: 11, color: '#d1fae5' }}>Vérifié par SymbioNexus — {new Date().toLocaleDateString('fr-FR')}</div>
              </div>
            </div>

            <div style={{ padding: 24 }}>
              <div style={{ fontSize: 11, color: '#64748b', letterSpacing: '.05em' }}>IDENTIFIANT</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, wordBreak: 'break-all' }}>{passport.id}</div>

              {[
                ['Matière', listing?.title || listing?.materialType || '—'],
                ['Catégorie', listing?.materialCategory || '—'],
                ['Volume', `${passport.contract?.volumeEngagedKg ?? '—'} kg`],
                ['Vendeur', `${seller?.name || '—'} — ${seller?.companyCity || ''}`],
                ['Acheteur', `${buyer?.name || '—'} — ${buyer?.companyCity || ''}`],
                ['Statut transport', STATUS_LABELS[passport.transportStatus] || passport.transportStatus],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderBottom: '1px solid #1a2540', fontSize: 13 }}>
                  <span style={{ color: '#64748b' }}>{k}</span>
                  <span style={{ fontWeight: 600, textAlign: 'right' }}>{v}</span>
                </div>
              ))}

              {carbon && (
                <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#6ee7b7', fontSize: 13, fontWeight: 600 }}>
                  🌱 {carbon.co2AvoidedTonnes} tonnes de CO₂ évitées
                </div>
              )}
            </div>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 11, color: '#475569', marginTop: 18 }}>
          Traçabilité de l&apos;économie circulaire — SymbioNexus, Cameroun
        </p>
      </div>
    </div>
  );
}
