'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function PassportDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [passport, setPassport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadPassport(); }, [params.id]);

  const loadPassport = async () => {
    try {
      const result = await api.getPassport(params.id);
      setPassport(result.data);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      await api.updateTransportStatus(params.id, status);
      // Auto-generate carbon credit on CONFIRMED
      if (status === 'CONFIRMED') {
        await api.generateCarbonCredit(params.id);
      }
      loadPassport();
    } catch (err) { console.error(err); }
  };

  const statusOrder = ['CREATED', 'PICKED_UP', 'IN_TRANSIT', 'NEAR_DESTINATION', 'DELIVERED', 'CONFIRMED'];

  if (isLoading) return <div className="spinner" style={{ margin: '80px auto' }} />;
  if (!passport) return <div style={{ textAlign: 'center', padding: '80px' }}>Passeport non trouvé.</div>;

  const currentStatusIndex = statusOrder.indexOf(passport.transportStatus);
  const isBuyer = user?.companyId === passport.contract?.buyerCompanyId;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <div className="badge badge-primary" style={{ marginBottom: '12px' }}>Passeport {passport.id}</div>
          <h1 className="page-title">{passport.contract?.match?.listing?.title}</h1>
        </div>
        {passport.qrCodeData && (
          <img src={passport.qrCodeData} alt="QR Code" style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', border: '2px solid white' }} />
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Traçabilité (Timeline) */}
        <div className="neo-card" style={{ padding: '32px' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px' }}>
            📍 Traçabilité logistique
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {statusOrder.map((status, index) => {
              const isCompleted = index <= currentStatusIndex;
              const isActive = index === currentStatusIndex;
              
              const labels: any = {
                CREATED: { title: 'Passeport créé', icon: '📝' },
                PICKED_UP: { title: 'Matière enlevée', icon: '🏭' },
                IN_TRANSIT: { title: 'En transit', icon: '🚛' },
                NEAR_DESTINATION: { title: 'En approche', icon: '📡' },
                DELIVERED: { title: 'Livré sur site', icon: '📥' },
                CONFIRMED: { title: 'Réception confirmée', icon: '✅' },
              };

              return (
                <div key={status} style={{ display: 'flex', gap: '20px' }}>
                  {/* Timeline line */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: isCompleted ? 'var(--gradient-primary)' : 'var(--color-bg-elevated)',
                      border: `2px solid ${isCompleted ? 'transparent' : 'var(--border-subtle)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
                      color: isCompleted ? 'white' : 'var(--color-text-muted)',
                      boxShadow: isActive ? 'var(--shadow-glow)' : 'none',
                    }}>
                      {labels[status].icon}
                    </div>
                    {index < statusOrder.length - 1 && (
                      <div style={{
                        width: '2px', height: '40px',
                        background: index < currentStatusIndex ? 'var(--color-primary-500)' : 'var(--border-subtle)',
                        margin: '4px 0'
                      }} />
                    )}
                  </div>
                  
                  {/* Timeline content */}
                  <div style={{ paddingTop: '8px', paddingBottom: '32px' }}>
                    <div style={{ fontWeight: isActive ? 700 : 500, color: isCompleted ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                      {labels[status].title}
                    </div>
                    {status === 'CONFIRMED' && passport.carbonCredit && (
                      <div className="badge badge-success" style={{ marginTop: '8px' }}>
                        🌱 Crédit Carbone généré ({passport.carbonCredit.co2AvoidedTonnes}t CO₂)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick actions for demo */}
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '16px' }}>Actions (Démo)</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {statusOrder.map((status, i) => (
                <button
                  key={status}
                  onClick={() => handleUpdateStatus(status)}
                  disabled={i <= currentStatusIndex}
                  className="btn-ghost"
                  style={{ border: '1px solid var(--border-subtle)', fontSize: '0.8rem', opacity: i <= currentStatusIndex ? 0.5 : 1 }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Détails Contrat */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
              Détails de l&apos;expédition
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.9rem' }}>
              <div>
                <div style={{ color: 'var(--color-text-muted)', marginBottom: '4px' }}>Matière</div>
                <div style={{ fontWeight: 600 }}>{passport.contract?.match?.listing?.materialType}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-text-muted)', marginBottom: '4px' }}>Volume</div>
                <div style={{ fontWeight: 600 }}>{passport.contract?.volumeEngagedKg} kg</div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <div style={{ color: 'var(--color-info)', fontSize: '0.8rem', marginBottom: '4px' }}>Expéditeur (Vendeur)</div>
                <div style={{ fontWeight: 600 }}>{passport.contract?.sellerCompany?.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{passport.contract?.sellerCompany?.address}</div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ color: 'var(--success)', fontSize: '0.8rem', marginBottom: '4px' }}>Destinataire (Acheteur)</div>
                <div style={{ fontWeight: 600 }}>{passport.contract?.buyerCompany?.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{passport.contract?.buyerCompany?.address}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
