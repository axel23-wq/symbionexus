'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { waLink } from '@/lib/contact';

const MARKET_LABEL: Record<string, string> = {
  GENERATED: 'Généré', CERTIFIED: 'Certifié', LISTED_FOR_SALE: 'En vente', SOLD: 'Vendu', RETIRED: 'Compensé',
};

export default function CarbonPage() {
  const [stats, setStats] = useState<any>(null);
  const [credits, setCredits] = useState<any[]>([]);
  const [market, setMarket] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (m: string) => { setToast(m); window.setTimeout(() => setToast(''), 2600); };

  const loadData = useCallback(async () => {
    try {
      const [statsRes, creditsRes, marketRes] = await Promise.all([
        api.getCarbonStats(),
        api.getMyCarbonCredits(),
        api.getCarbonMarket(),
      ]);
      setStats(statsRes.data);
      setCredits(creditsRes.data || []);
      setMarket(marketRes.data || []);
    } catch (err) {
      console.error('Carbon load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const act = async (id: string, fn: () => Promise<unknown>, msg: string) => {
    setBusyId(id);
    try { await fn(); await loadData(); showToast(msg); }
    catch (e) { console.error(e); showToast('⚠ Action échouée'); }
    finally { setBusyId(null); }
  };

  const downloadCert = async (id: string) => {
    setBusyId(id);
    try { await api.downloadCarbonCertificate(id); } catch (e) { console.error(e); showToast('⚠ Échec du certificat'); }
    finally { setBusyId(null); }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🌱 Crédits Carbone</h1>
          <p className="page-subtitle">
            Votre impact environnemental positif, certifié et valorisé
          </p>
        </div>
      </div>

      {/* Hero stat cards */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: '140px', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {/* CO2 Avoided */}
          <div className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #10b981, #059669)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.5rem',
              }}>🌍</div>
              <div>
                <div className="stat-value" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {stats?.totalCO2Avoided?.toFixed(1) || '0'}t
                </div>
                <div className="stat-label">CO₂ évité</div>
              </div>
            </div>
          </div>

          {/* Equivalent trees */}
          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: 'var(--radius-md)',
                background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.5rem',
              }}>🌳</div>
              <div>
                <div className="stat-value">{stats?.totalTrees || 0}</div>
                <div className="stat-label">Arbres équivalents</div>
              </div>
            </div>
          </div>

          {/* Car km */}
          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: 'var(--radius-md)',
                background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.5rem',
              }}>🚗</div>
              <div>
                <div className="stat-value">{stats?.totalCarKm?.toLocaleString('fr-FR') || 0}</div>
                <div className="stat-label">Km voiture évités</div>
              </div>
            </div>
          </div>

          {/* Estimated value */}
          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.5rem',
              }}>💰</div>
              <div>
                <div className="stat-value" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {(stats?.estimatedValue || 0).toLocaleString('fr-FR')} FCFA
                </div>
                <div className="stat-label">Valeur estimée</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Carbon credits list */}
      <div className="neo-card" style={{ padding: '24px' }}>
        <h2 style={{
          fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700,
          marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          📜 Certificats de crédits carbone
        </h2>

        {credits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🌱</div>
            <p>Vos certificats apparaîtront ici après chaque livraison confirmée.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {credits.map((credit: any, i: number) => (
              <div key={credit.id} className="glass-card animate-fade-in" style={{
                padding: '20px',
                display: 'grid',
                gridTemplateColumns: '48px 1fr auto',
                gap: '16px',
                alignItems: 'center',
                animationDelay: `${i * 80}ms`,
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.3rem', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                }}>🌿</div>

                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>
                    {credit.co2AvoidedTonnes} tonnes CO₂ évitées
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '16px' }}>
                    <span>🌳 {credit.equivalentTrees} arbres</span>
                    <span>🚗 {credit.equivalentCarKm.toLocaleString('fr-FR')} km</span>
                    <span>📅 {new Date(credit.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <span className="badge badge-success">{MARKET_LABEL[credit.marketStatus] || credit.marketStatus}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b' }}>
                    ~{(credit.co2AvoidedTonnes * 50000).toLocaleString('fr-FR')} FCFA
                  </span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button className="carbon-btn" disabled={busyId === credit.id} onClick={() => downloadCert(credit.id)}>📄 Certificat</button>
                    {(credit.marketStatus === 'GENERATED' || credit.marketStatus === 'CERTIFIED') && (
                      <button className="carbon-btn green" disabled={busyId === credit.id} onClick={() => act(credit.id, () => api.listCarbonCredit(credit.id), '💰 Mis en vente')}>💰 Vendre</button>
                    )}
                    {credit.marketStatus === 'LISTED_FOR_SALE' && (
                      <button className="carbon-btn" disabled={busyId === credit.id} onClick={() => act(credit.id, () => api.unlistCarbonCredit(credit.id), 'Retiré de la vente')}>↩ Retirer</button>
                    )}
                    {credit.marketStatus !== 'RETIRED' && (
                      <button className="carbon-btn amber" disabled={busyId === credit.id} onClick={() => act(credit.id, () => api.retireCarbonCredit(credit.id), '🍃 Crédit compensé')}>🍃 Compenser</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Marché secondaire — fonctionnel */}
      <div className="neo-card" style={{ padding: '24px', marginTop: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          🔄 Marché secondaire des crédits carbone
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 20 }}>
          Achetez des crédits mis en vente par d&apos;autres entreprises pour compenser votre empreinte.
        </p>
        {market.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🌍</div>
            <p>Aucun crédit en vente. Mettez un de vos crédits en vente ci-dessus pour l&apos;y voir apparaître.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {market.map((m: any) => (
              <div key={m.id} className="glass-card" style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>🌿 {m.co2AvoidedTonnes} t CO₂ — {m.company?.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    📍 {m.company?.companyCity} · {m.passport?.contract?.match?.listing?.materialType || 'Crédit certifié'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <span style={{ fontWeight: 700, color: '#f59e0b' }}>{((m.pricePerTonne || 50000) * m.co2AvoidedTonnes).toLocaleString('fr-FR')} FCFA</span>
                  <a href={waLink(`Bonjour, je suis intéressé par vos crédits carbone (${m.co2AvoidedTonnes} t CO₂) proposés sur SymbioNexus. Pouvons-nous en discuter ?`)} target="_blank" rel="noopener noreferrer" className="carbon-btn green" style={{ textDecoration: 'none' }}>💬 Contacter le vendeur</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast de confirmation */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, background: '#0f1729', border: '1.5px solid rgba(16,185,129,0.5)', color: '#e2e8f0', padding: '12px 22px', borderRadius: 14, fontSize: 14, fontWeight: 600, boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
          {toast}
        </div>
      )}

      <style>{`
        .carbon-btn { font-size:11px; font-weight:600; padding:6px 12px; border-radius:9px; border:1.5px solid var(--border-subtle); background:transparent; color:var(--color-text-secondary); cursor:pointer; transition:all .2s; white-space:nowrap; }
        .carbon-btn:hover:not(:disabled) { border-color:#2a3a5a; color:var(--color-text-primary); }
        .carbon-btn:disabled { opacity:.5; cursor:not-allowed; }
        .carbon-btn.green { border-color:rgba(16,185,129,0.4); color:#34d399; }
        .carbon-btn.green:hover:not(:disabled) { background:rgba(16,185,129,0.1); }
        .carbon-btn.amber { border-color:rgba(245,158,11,0.4); color:#fbbf24; }
        .carbon-btn.amber:hover:not(:disabled) { background:rgba(245,158,11,0.1); }
      `}</style>
    </div>
  );
}
