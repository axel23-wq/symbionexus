'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n/LanguageProvider';

export default function MatchesPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [matches, setMatches] = useState<any[]>([]);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedListing, setSelectedListing] = useState('');

  const loadMatches = useCallback(async () => {
    try {
      const [matchesRes, listingsRes] = await Promise.all([
        api.getMyMatches().catch(() => ({ data: [] })),
        user?.role === 'SELLER' ? api.getMyListings().catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
      ]);
      setMatches(matchesRes.data || []);
      setMyListings(listingsRes.data || []);
      if (listingsRes.data && listingsRes.data.length > 0) {
        setSelectedListing(listingsRes.data[0].id);
      }
    } catch (err) {
      console.error('Matches load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const runAiMatch = async () => {
    if (!selectedListing) return;
    setIsScanning(true);
    try {
      await api.computeAiMatch(selectedListing);
      await loadMatches();
    } catch (err) {
      console.error('AI match error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleAccept = async (matchId: string) => {
    // ... rest remains the same for handlers
    try {
      const result = await api.acceptMatch(matchId);
      if (result.data.status === 'CONFIRMED') {
        await api.generateContract(matchId);
      }
      loadMatches();
    } catch (err) {
      console.error('Accept error:', err);
    }
  };

  const handleReject = async (matchId: string) => {
    try {
      await api.rejectMatch(matchId);
      loadMatches();
    } catch (err) {
      console.error('Reject error:', err);
    }
  };

  const getStatusInfo = (status: string) => {
    const badgeMap: Record<string, string> = {
      PROPOSED: 'badge-info', ACCEPTED_SELLER: 'badge-warning', ACCEPTED_BUYER: 'badge-warning',
      CONFIRMED: 'badge-success', REJECTED: 'badge-danger',
    };
    const l = t('mtc.status.' + status);
    return { label: l.startsWith('mtc.') ? status : l, badge: badgeMap[status] || 'badge-info' };
  };

  const ScoreRing = ({ score }: { score: number }) => {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
      <div className="score-ring">
        <svg viewBox="0 0 76 76">
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0d9488" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          <circle className="track" cx="38" cy="38" r={radius} />
          <circle
            className="fill"
            cx="38"
            cy="38"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            stroke="url(#scoreGradient)"
          />
        </svg>
        <div className="score-value">{score}</div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🤖 {t('mtc.title')}</h1>
          <p className="page-subtitle">
            {t('mtc.subtitle')}
          </p>
        </div>
      </div>

      {/* AI Trigger Panel */}
      {user?.role === 'SELLER' && myListings.length > 0 && (
        <div className="neo-card" style={{ padding: '24px', marginBottom: '32px', background: 'linear-gradient(to right, rgba(13,148,136,0.05), rgba(168,85,247,0.05))' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>
                🧠 {t('mtc.dl.title')}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', maxWidth: '500px' }}>
                {t('mtc.dl.desc')}
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <select 
                className="input-field" 
                value={selectedListing} 
                onChange={(e) => setSelectedListing(e.target.value)}
                style={{ width: '250px' }}
                disabled={isScanning}
              >
                {myListings.map(l => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
              <button 
                className="btn-primary" 
                onClick={runAiMatch} 
                disabled={isScanning}
                style={{
                  background: isScanning ? 'var(--color-text-muted)' : 'linear-gradient(135deg, #a855f7, #3b82f6)',
                  boxShadow: isScanning ? 'none' : '0 0 20px rgba(168, 85, 247, 0.4)'
                }}
              >
                {isScanning ? t('mtc.scanning') + ' 🔄' : t('mtc.scan') + ' 🚀'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: '180px', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🤖</div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
            {t('mtc.empty')}
          </h3>
          <p>
            {user?.role === 'SELLER' ? t('mtc.emptySeller') : t('mtc.emptyBuyer')}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {matches.map((match: any, i: number) => {
            const statusInfo = getStatusInfo(match.status);
            const isActionable = ['PROPOSED', 'ACCEPTED_SELLER', 'ACCEPTED_BUYER'].includes(match.status);
            const canAccept =
              (match.status === 'PROPOSED') ||
              (match.status === 'ACCEPTED_SELLER' && user?.companyId === match.buyerCompanyId) ||
              (match.status === 'ACCEPTED_BUYER' && user?.companyId === match.sellerCompanyId);

            return (
              <div
                key={match.id}
                className="neo-card animate-fade-in"
                style={{
                  padding: '28px',
                  animationDelay: `${i * 100}ms`,
                }}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr auto',
                  gap: '24px',
                  alignItems: 'center',
                }}>
                  {/* Score ring */}
                  <ScoreRing score={match.compatibilityScore} />

                  {/* Match info */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                      }}>
                        {match.listing?.title}
                      </h3>
                      <span className={`badge ${statusInfo.badge}`}>{statusInfo.label}</span>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '24px',
                      fontSize: '0.85rem',
                      color: 'var(--color-text-secondary)',
                    }}>
                      <span>🏭 {match.sellerCompany?.name}</span>
                      <span style={{ color: 'var(--color-primary-400)' }}>→</span>
                      <span>🏪 {match.buyerCompany?.name}</span>
                      <span>📍 {match.distanceKm?.toFixed(1)} km</span>
                    </div>

                    {/* Score breakdown */}
                    <div style={{
                      display: 'flex',
                      gap: '16px',
                      marginTop: '12px',
                    }}>
                      {match.scoreBreakdown && (
                        <>
                          <ScoreBar label={t('mtc.score.material')} value={match.scoreBreakdown.materialScore} color="#10b981" />
                          <ScoreBar label={t('mtc.score.distance')} value={match.scoreBreakdown.distanceScore} color="#3b82f6" />
                          <ScoreBar label={t('mtc.score.volume')} value={match.scoreBreakdown.volumeScore} color="#f59e0b" />
                          <ScoreBar label={t('mtc.score.trust')} value={match.scoreBreakdown.trustScore} color="#8b5cf6" />
                        </>
                      )}
                    </div>
                    
                    {match.scoreBreakdown?.aiInsight && (
                      <div style={{
                        marginTop: '16px',
                        padding: '12px 16px',
                        background: 'rgba(168, 85, 247, 0.08)',
                        borderRadius: 'var(--radius-md)',
                        borderLeft: '4px solid #a855f7',
                        fontSize: '0.85rem',
                        color: 'var(--color-text-primary)'
                      }}>
                        <div style={{ fontWeight: 600, color: '#a855f7', marginBottom: '4px', fontSize: '0.8rem' }}>
                          ✨ AI Insight
                        </div>
                        {match.scoreBreakdown.aiInsight}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {isActionable && canAccept && (
                      <button
                        className="btn-primary"
                        style={{ padding: '10px 20px', fontSize: '0.85rem' }}
                        onClick={() => handleAccept(match.id)}
                      >
                        ✅ {t('mtc.accept')}
                      </button>
                    )}
                    {isActionable && (
                      <button
                        className="btn-secondary"
                        style={{ padding: '10px 20px', fontSize: '0.85rem' }}
                        onClick={() => handleReject(match.id)}
                      >
                        ❌ {t('mtc.reject')}
                      </button>
                    )}
                    {match.status === 'CONFIRMED' && (
                      <span className="badge badge-success" style={{ padding: '10px 16px' }}>
                        🎉 {t('mtc.status.CONFIRMED')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ minWidth: '80px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.7rem',
        marginBottom: '4px',
        color: 'var(--color-text-muted)',
      }}>
        <span>{label}</span>
        <span style={{ color, fontWeight: 600 }}>{value}%</span>
      </div>
      <div style={{
        height: '4px',
        background: 'var(--border-subtle)',
        borderRadius: '2px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${value}%`,
          background: color,
          borderRadius: '2px',
          transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  );
}
