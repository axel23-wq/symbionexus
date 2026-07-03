'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [listing, setListing] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMatching, setIsMatching] = useState(false);

  const loadListing = useCallback(async () => {
    try {
      const result = await api.getListing(id);
      setListing(result.data);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  }, [id]);

  useEffect(() => { loadListing(); }, [loadListing]);

  const handleComputeMatches = async () => {
    setIsMatching(true);
    try {
      await api.computeMatches(id);
      router.push('/matches');
    } catch (err) { console.error(err); }
    finally { setIsMatching(false); }
  };

  if (isLoading) return <div className="spinner" style={{ margin: '80px auto' }} />;
  if (!listing) return <div style={{ textAlign: 'center', padding: '80px' }}>Annonce non trouvée.</div>;

  const isOwner = user?.companyId === listing.companyId;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <button onClick={() => router.back()} className="btn-ghost">← Retour</button>
      </div>

      <div className="neo-card" style={{ padding: '40px', position: 'relative', overflow: 'hidden' }}>
        {/* Background glow based on category */}
        <div style={{
          position: 'absolute', top: '-10%', right: '-10%', width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(13,148,136,0.1) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <span className="badge badge-info">{listing.materialCategory}</span>
                <span className={`badge ${listing.status === 'PUBLISHED' ? 'badge-success' : 'badge-warning'}`}>
                  {listing.status}
                </span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>
                {listing.title}
              </h1>
              <p style={{ color: 'var(--color-primary-400)', fontSize: '1.1rem', fontWeight: 600 }}>
                {listing.materialType}
              </p>
            </div>
            {isOwner && listing.status === 'PUBLISHED' && (
              <button
                className="btn-primary"
                onClick={handleComputeMatches}
                disabled={isMatching}
              >
                {isMatching ? 'Recherche...' : '🤖 Trouver des acheteurs'}
              </button>
            )}
            {!isOwner && user?.role === 'BUYER' && listing.status === 'PUBLISHED' && (
              <button className="btn-primary" onClick={() => router.push('/messages')}>
                💬 Contacter le vendeur
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px', marginTop: '40px' }}>
            {/* Left Col: Details */}
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                Description
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.8, marginBottom: '32px', whiteSpace: 'pre-wrap' }}>
                {listing.description}
              </p>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                Profil Chimique / Technique
              </h3>
              {listing.chemicalProfile ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--color-bg-base)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  {Object.entries(listing.chemicalProfile).map(([key, val]) => (
                    <div key={key}>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'capitalize' }}>{key}</span>
                      <div style={{ fontWeight: 600 }}>{String(val)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Aucune donnée technique fournie.</p>
              )}
            </div>

            {/* Right Col: Stats & Company */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Volume</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                      {listing.volumeKg >= 1000 ? `${(listing.volumeKg / 1000).toFixed(1)}t` : `${listing.volumeKg}kg`}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Disponibilité</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{listing.frequency}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prix demandé</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b' }}>
                      {listing.pricePerKg ? `${listing.pricePerKg} FCFA / kg` : 'À négocier'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '24px' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '16px' }}>
                  Entreprise productrice
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700, color: 'white'
                  }}>
                    {listing.company?.name?.substring(0, 2) || 'SN'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{listing.company?.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{listing.company?.companySector}</div>
                  </div>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                  📍 {listing.company?.companyAddress}, {listing.company?.companyCity}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-success">Vérifié (KYB)</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-primary-400)', fontWeight: 600 }}>
                    ⭐ Trust Score : {listing.company?.trustScore ? (listing.company.trustScore * 100).toFixed(0) : 50}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
