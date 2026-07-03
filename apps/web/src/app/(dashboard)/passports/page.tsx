'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function PassportsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPassports = useCallback(async () => {
    try {
      // Get contracts first, then passports from them (simplified for MVP)
      const result = await api.getMyContracts();
      setContracts(result.data || []);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { loadPassports(); }, [loadPassports]);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📦 Passeports Numériques</h1>
          <p className="page-subtitle">Traçabilité complète de vos expéditions de matières</p>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: '220px', borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : contracts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📦</div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
            Aucun passeport
          </h3>
          <p>Signez un contrat pour créer un passeport numérique et démarrer la traçabilité.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {contracts.map((contract: any, i: number) => (
            contract._count?.materialPassports > 0 && (
              <div key={contract.id} className="neo-card" style={{ padding: '24px', animationDelay: `${i * 100}ms` }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
                  Contrat : {contract.match?.listing?.title}
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                  {contract.materialPassports?.map((passport: any) => (
                    <Link key={passport.id} href={`/passports/${passport.id}`} style={{ textDecoration: 'none' }}>
                      <div className="glass-card" style={{ padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                          width: '60px', height: '60px', borderRadius: 'var(--radius-md)',
                          background: 'var(--color-bg-base)', border: '1px solid var(--border-subtle)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                        }}>
                          {passport.qrCodeData ? (
                            <img src={passport.qrCodeData} alt="QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          ) : (
                            <div style={{ fontSize: '1.5rem' }}>📱</div>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{passport.id.split('-')[1]}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                            Statut : <span className="badge badge-info">{passport.transportStatus}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  
                  {contract.materialPassports?.length === 0 && (
                     <div style={{ padding: '16px', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                       Aucun passeport créé pour ce contrat.
                     </div>
                  )}
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
