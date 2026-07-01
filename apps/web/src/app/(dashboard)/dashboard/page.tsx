'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import Link from 'next/link';

const DashboardCharts = dynamic(() => import('@/components/DashboardCharts'), { ssr: false });

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
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const result = await api.getDashboard();
      setData(result.data);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = data?.overview
    ? [
        { icon: '📋', label: 'Annonces actives', value: data.overview.activeListings, color: '#3b82f6' },
        { icon: '🤖', label: 'Matchs en attente', value: data.overview.pendingMatches, color: '#f59e0b' },
        { icon: '📝', label: 'Contrats actifs', value: data.overview.activeContracts, color: '#8b5cf6' },
        { icon: '✅', label: 'Contrats complétés', value: data.overview.completedContracts, color: '#10b981' },
        { icon: '🌱', label: 'CO₂ évité (t)', value: data.overview.co2Avoided.toFixed(1), color: '#059669' },
        { icon: '💰', label: 'Revenus (€)', value: data.overview.revenue.toLocaleString('fr-FR'), color: '#f59e0b' },
      ]
    : [];

  const quickActions =
    user?.role === 'SELLER'
      ? [
          { icon: '➕', label: 'Nouvelle annonce', href: '/listings/new', color: 'var(--gradient-primary)' },
          { icon: '🤖', label: 'Lancer matchmaking', href: '/matches', color: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' },
          { icon: '📊', label: 'Voir mes annonces', href: '/listings', color: 'linear-gradient(135deg, #f59e0b, #f97316)' },
        ]
      : [
          { icon: '🔍', label: 'Explorer marketplace', href: '/marketplace', color: 'var(--gradient-primary)' },
          { icon: '🤖', label: 'Mes matchs', href: '/matches', color: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' },
          { icon: '🌱', label: 'Crédits carbone', href: '/carbon', color: 'linear-gradient(135deg, #10b981, #059669)' },
        ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Bonjour, {user?.firstName} 👋
          </h1>
          <p className="page-subtitle">
            {user?.company?.name} — {user?.role === 'SELLER' ? 'Vendeur' : user?.role === 'BUYER' ? 'Acheteur' : user?.role}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="badge badge-primary" style={{ fontSize: '0.8rem', padding: '6px 16px' }}>
            ⭐ Trust Score: {((data?.overview.trustScore || 0.5) * 100).toFixed(0)}%
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
          📋 Activité récente
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
                        {contract.match?.listing?.title || 'Contrat'}
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
                      {contract.totalPrice?.toFixed(0)}€
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
            <p>Aucune activité récente</p>
            <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>
              Commencez par{' '}
              <Link href={user?.role === 'SELLER' ? '/listings/new' : '/marketplace'}>
                {user?.role === 'SELLER' ? 'créer une annonce' : 'explorer la marketplace'}
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
