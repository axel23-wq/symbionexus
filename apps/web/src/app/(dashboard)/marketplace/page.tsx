'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

const CATEGORIES = [
  { key: '', label: 'Toutes', icon: '🔄' },
  { key: 'METALS', label: 'Métaux', icon: '⚙️', color: '#f59e0b' },
  { key: 'PLASTICS', label: 'Plastiques', icon: '♻️', color: '#3b82f6' },
  { key: 'BIOMASS', label: 'Biomasse', icon: '🌿', color: '#10b981' },
  { key: 'CHEMICALS', label: 'Chimiques', icon: '🧪', color: '#ef4444' },
  { key: 'TEXTILE', label: 'Textile', icon: '🧵', color: '#8b5cf6' },
  { key: 'CONSTRUCTION', label: 'BTP', icon: '🏗️', color: '#78716c' },
  { key: 'GLASS', label: 'Verre', icon: '🔬', color: '#06b6d4' },
  { key: 'PAPER', label: 'Papier', icon: '📄', color: '#a3e635' },
  { key: 'ELECTRONIC', label: 'DEEE', icon: '💻', color: '#ec4899' },
];

const FREQUENCY_MAP: Record<string, string> = {
  DAILY: 'Quotidien',
  WEEKLY: 'Hebdomadaire',
  BIWEEKLY: 'Bimensuel',
  MONTHLY: 'Mensuel',
  QUARTERLY: 'Trimestriel',
  ON_DEMAND: 'À la demande',
};

export default function MarketplacePage() {
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadListings = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (activeCategory) params.materialCategory = activeCategory;
      if (searchTerm) params.search = searchTerm;
      const result = await api.getListings(params);
      setListings(result.data || []);
    } catch (err) {
      console.error('Listings load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, searchTerm]);

  // Auto-reload on category change only; search is manual (submit).
  useEffect(() => {
    loadListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadListings();
  };

  const getCategoryColor = (category: string) => {
    return CATEGORIES.find((c) => c.key === category)?.color || '#64748b';
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">🏪 Marketplace</h1>
          <p className="page-subtitle">
            Catalogue des matières secondaires disponibles
          </p>
        </div>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ marginBottom: '24px' }}>
        <div className="search-bar" style={{ maxWidth: '600px', width: '100%' }}>
          <span style={{ fontSize: '1.1rem' }}>🔍</span>
          <input
            type="text"
            placeholder="Rechercher : marc de café, copeaux aluminium, chutes plastique..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: '6px 16px', fontSize: '0.8rem' }}
          >
            Rechercher
          </button>
        </div>
      </form>

      {/* Category filters */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '8px',
        marginBottom: '24px',
      }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={activeCategory === cat.key ? 'btn-primary' : 'btn-secondary'}
            style={{
              padding: '8px 16px',
              fontSize: '0.8rem',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Listings grid */}
      {isLoading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px',
        }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton" style={{ height: '280px', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 24px',
          color: 'var(--color-text-muted)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
            Aucune annonce trouvée
          </h3>
          <p>Essayez une autre catégorie ou un terme de recherche différent.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px',
        }}>
          {listings.map((listing: any, i: number) => (
            <Link
              key={listing.id}
              href={`/marketplace/${listing.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="neo-card animate-fade-in"
                style={{
                  padding: '24px',
                  cursor: 'pointer',
                  animationDelay: `${i * 80}ms`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Category badge + status */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}>
                  <span
                    className="badge"
                    style={{
                      color: getCategoryColor(listing.materialCategory),
                      background: `${getCategoryColor(listing.materialCategory)}15`,
                      borderColor: `${getCategoryColor(listing.materialCategory)}30`,
                    }}
                  >
                    {CATEGORIES.find((c) => c.key === listing.materialCategory)?.icon}{' '}
                    {CATEGORIES.find((c) => c.key === listing.materialCategory)?.label}
                  </span>
                  <span className="badge badge-success">
                    {listing.status}
                  </span>
                </div>

                {/* Title */}
                <h3 style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  marginBottom: '8px',
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.3,
                }}>
                  {listing.title}
                </h3>

                {/* Description */}
                <p style={{
                  fontSize: '0.85rem',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '16px',
                  lineHeight: 1.6,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  flex: 1,
                }}>
                  {listing.description}
                </p>

                {/* Stats row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  padding: '12px 0',
                  borderTop: '1px solid var(--border-subtle)',
                }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Volume
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-primary-400)' }}>
                      {listing.volumeKg >= 1000 ? `${(listing.volumeKg / 1000).toFixed(1)}t` : `${listing.volumeKg}kg`}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Fréquence
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {FREQUENCY_MAP[listing.frequency] || listing.frequency}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Prix/kg
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f59e0b' }}>
                      {listing.pricePerKg ? `${listing.pricePerKg} FCFA` : 'À négocier'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Localisation
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      📍 {listing.company?.companyCity || 'Cameroun'}
                    </div>
                  </div>
                </div>

                {/* Company row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-subtle)',
                }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'white',
                  }}>
                    {listing.company?.name?.substring(0, 2) || 'SN'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.8rem', fontWeight: 600,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {listing.company?.name}
                    </div>
                  </div>
                  {listing.company?.trustScore && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-primary-400)' }}>
                      ⭐ {(listing.company.trustScore * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
