'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function MatchesPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMatches = useCallback(async () => {
    try {
      const result = await api.getMyMatches();
      setMatches(result.data || []);
    } catch (err) {
      console.error('Matches load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const handleAccept = async (matchId: string) => {
    try {
      const result = await api.acceptMatch(matchId);
      // If match is confirmed, auto-generate contract
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
    const map: Record<string, { label: string; badge: string }> = {
      PROPOSED: { label: 'Proposé par l\'IA', badge: 'badge-info' },
      ACCEPTED_SELLER: { label: 'Accepté par le vendeur', badge: 'badge-warning' },
      ACCEPTED_BUYER: { label: 'Accepté par l\'acheteur', badge: 'badge-warning' },
      CONFIRMED: { label: 'Confirmé ✅', badge: 'badge-success' },
      REJECTED: { label: 'Rejeté', badge: 'badge-danger' },
    };
    return map[status] || { label: status, badge: 'badge-info' };
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
          <h1 className="page-title">🤖 Matchmaking IA</h1>
          <p className="page-subtitle">
            Correspondances trouvées par notre algorithme d&apos;intelligence artificielle
          </p>
        </div>
      </div>

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
            Aucun match en cours
          </h3>
          <p>
            {user?.role === 'SELLER'
              ? 'Publiez une annonce pour que l\'IA trouve des acheteurs compatibles.'
              : 'L\'IA vous proposera des correspondances dès qu\'une matière compatible sera disponible.'}
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
                          <ScoreBar label="Matière" value={match.scoreBreakdown.materialScore} color="#10b981" />
                          <ScoreBar label="Distance" value={match.scoreBreakdown.distanceScore} color="#3b82f6" />
                          <ScoreBar label="Volume" value={match.scoreBreakdown.volumeScore} color="#f59e0b" />
                          <ScoreBar label="Confiance" value={match.scoreBreakdown.trustScore} color="#8b5cf6" />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {isActionable && canAccept && (
                      <button
                        className="btn-primary"
                        style={{ padding: '10px 20px', fontSize: '0.85rem' }}
                        onClick={() => handleAccept(match.id)}
                      >
                        ✅ Accepter
                      </button>
                    )}
                    {isActionable && (
                      <button
                        className="btn-secondary"
                        style={{ padding: '10px 20px', fontSize: '0.85rem' }}
                        onClick={() => handleReject(match.id)}
                      >
                        ❌ Rejeter
                      </button>
                    )}
                    {match.status === 'CONFIRMED' && (
                      <span className="badge badge-success" style={{ padding: '10px 16px' }}>
                        🎉 Confirmé
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
