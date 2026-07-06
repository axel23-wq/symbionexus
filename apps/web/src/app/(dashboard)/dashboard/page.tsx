'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import Link from 'next/link';

const DashboardCharts = dynamic(() => import('@/components/DashboardCharts'), { ssr: false });
const SymbioNode3D = dynamic(() => import('@/components/SymbioNode3D'), { ssr: false });

interface DashboardData {
  overview: {
    activeListings: number;
    totalListings: number;
    pendingMatches: number;
    confirmedMatches: number;
    activeContracts: number;
    completedContracts: number;
    totalCarbonCredits: number;
    co2Avoided: number;
    revenue: number;
    trustScore: number;
  };
  recentContracts: any[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      const result = await api.getDashboard();
      setData(result.data);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = data?.overview
    ? [
        { icon: '📋', label: t('dash.stat.activeListings'), value: data.overview.activeListings, color: '#3b82f6' },
        { icon: '🤖', label: t('dash.stat.pendingMatches'), value: data.overview.pendingMatches, color: '#f59e0b' },
        { icon: '📝', label: t('dash.stat.activeContracts'), value: data.overview.activeContracts, color: '#8b5cf6' },
        { icon: '✅', label: t('dash.stat.completedContracts'), value: data.overview.completedContracts, color: '#10b981' },
        { icon: '🌱', label: t('dash.stat.co2'), value: data.overview.co2Avoided.toFixed(1), color: '#059669' },
        { icon: '💰', label: t('dash.stat.revenue'), value: data.overview.revenue.toLocaleString('fr-FR'), color: '#f59e0b' },
      ]
    : [];

  const quickActions =
    user?.role === 'SELLER'
      ? [
          { icon: '➕', label: t('dash.action.newListing'), href: '/listings/new', color: 'var(--gradient-primary)' },
          { icon: '🤖', label: t('dash.action.runMatch'), href: '/matches', color: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' },
          { icon: '📊', label: t('dash.action.myListings'), href: '/listings', color: 'linear-gradient(135deg, #f59e0b, #f97316)' },
        ]
      : [
          { icon: '🔍', label: t('dash.action.explore'), href: '/marketplace', color: 'var(--gradient-primary)' },
          { icon: '🤖', label: t('dash.action.myMatches'), href: '/matches', color: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' },
          { icon: '🌱', label: t('dash.action.carbon'), href: '/carbon', color: 'linear-gradient(135deg, #10b981, #059669)' },
        ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {t('dash.hello')}, {user?.firstName} 👋
          </h1>
          <p className="page-subtitle">
            {user?.company?.name} — {user?.role === 'SELLER' ? t('role.seller') : user?.role === 'BUYER' ? t('role.buyer') : user?.role}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="badge badge-primary" style={{ fontSize: '0.8rem', padding: '6px 16px' }}>
            ⭐ {t('dash.trustScore')}: {((data?.overview.trustScore || 0.5) * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Noyau IA de Matchmaking — visualisation 3D */}
      <style>{`
        .node-widget { display: grid; grid-template-columns: 1fr 340px; align-items: center; gap: 12px; }
        @media (max-width: 760px) { .node-widget { grid-template-columns: 1fr; } .node-widget .node-canvas { height: 200px; } }
      `}</style>
      <div style={{
        position: 'relative', borderRadius: 20, overflow: 'hidden', marginBottom: 32,
        border: '1.5px solid var(--border-subtle)',
        background: 'radial-gradient(ellipse at 80% 50%, rgba(168,85,247,0.12), transparent 60%), linear-gradient(135deg, rgba(13,148,136,0.12), rgba(10,17,40,0.4))',
      }}>
        <div className="node-widget">
          <div style={{ padding: '28px 32px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#34d399', marginBottom: 10 }}>
              <span>🧠</span> {t('dash.core.tag')}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>{t('dash.core.title')}</h2>
            <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, maxWidth: 520 }}>
              {t('dash.core.desc')}
            </p>
            <div style={{ display: 'flex', gap: 28, marginTop: 18 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#22d3ee' }}>{data?.overview.pendingMatches ?? 0}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{t('dash.stat.pendingMatches')}</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#a855f7' }}>{data?.overview.activeListings ?? 0}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{t('dash.stat.activeListings')}</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#34d399' }}>{((data?.overview.trustScore || 0.5) * 100).toFixed(0)}%</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{t('dash.trustScore')}</div>
              </div>
            </div>
          </div>
          <div className="node-canvas" style={{ height: 240 }}>
            <SymbioNode3D variant="widget" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        {quickActions.map((action, i) => (
          <Link key={i} href={action.href} style={{ textDecoration: 'none' }}>
            <div className="glass-card" style={{
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              cursor: 'pointer',
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                background: action.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}>
                {action.icon}
              </div>
              <span style={{
                fontWeight: 600,
                fontSize: '0.9rem',
                color: 'var(--color-text-primary)',
              }}>
                {action.label}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton" style={{ height: '120px', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}>
          {stats.map((stat, i) => (
            <div
              key={i}
              className="stat-card animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
                <div className="stat-icon" style={{
                  background: `${stat.color}15`,
                  color: stat.color,
                }}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analytics (Recharts) */}
      {!isLoading && <DashboardCharts />}

      {/* Recent Contracts */}
      <div className="neo-card" style={{ padding: '24px' }}>
        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.2rem',
          fontWeight: 700,
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          📋 {t('dash.recent.title')}
        </h2>

        {data?.recentContracts && data.recentContracts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.recentContracts.map((contract: any, i: number) => (
              <Link key={i} href={`/contracts/${contract.id}`} style={{ textDecoration: 'none' }}>
                <div className="glass-card" style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: 'var(--radius-sm)',
                      background: 'rgba(13, 148, 136, 0.1)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '1.1rem',
                    }}>
                      📝
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {contract.match?.listing?.title || t('dash.recent.contract')}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        {contract.sellerCompany?.name} → {contract.buyerCompany?.name}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className={`badge ${
                      contract.status === 'COMPLETED' ? 'badge-success' :
                      contract.status === 'SIGNED' ? 'badge-info' :
                      'badge-warning'
                    }`}>
                      {contract.status}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                      {contract.totalPrice?.toLocaleString('fr-FR')} FCFA
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center', padding: '40px',
            color: 'var(--color-text-muted)',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📋</div>
            <p>{t('dash.recent.empty')}</p>
            <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>
              {t('dash.recent.startBy')}{' '}
              <Link href={user?.role === 'SELLER' ? '/listings/new' : '/marketplace'}>
                {user?.role === 'SELLER' ? t('dash.recent.createListing') : t('dash.recent.exploreMarket')}
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
