'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function CarbonPage() {
  const [stats, setStats] = useState<any>(null);
  const [credits, setCredits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, creditsRes] = await Promise.all([
        api.getCarbonStats(),
        api.getMyCarbonCredits(),
      ]);
      setStats(statsRes.data);
      setCredits(creditsRes.data || []);
    } catch (err) {
      console.error('Carbon load error:', err);
    } finally {
      setIsLoading(false);
    }
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
                  {stats?.estimatedValue?.toFixed(0) || 0}€
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

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span className="badge badge-success">{credit.marketStatus}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b' }}>
                    ~{(credit.co2AvoidedTonnes * 80).toFixed(0)}€
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Coming soon: Secondary market */}
      <div className="neo-card" style={{
        padding: '32px',
        marginTop: '24px',
        background: 'linear-gradient(145deg, rgba(13, 148, 136, 0.05), rgba(10, 17, 40, 0.9))',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔮</div>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '8px' }}>
          Marché secondaire de crédits carbone
        </h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          Bientôt disponible — Revendez vos crédits carbone excédentaires à d&apos;autres entreprises
        </p>
        <span className="badge badge-info" style={{ marginTop: '12px', display: 'inline-flex' }}>
          Prochainement
        </span>
      </div>
    </div>
  );
}
