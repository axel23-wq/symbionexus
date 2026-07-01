'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

export default function ContractsPage() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadContracts(); }, []);

  const loadContracts = async () => {
    try {
      const result = await api.getMyContracts();
      setContracts(result.data || []);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const handleSign = async (id: string) => {
    try {
      await api.signContract(id);
      loadContracts();
    } catch (err) { console.error(err); }
  };

  const handleCreatePassport = async (contractId: string) => {
    try {
      const result = await api.createPassport(contractId);
      if (result.data) {
        window.location.href = `/passports/${result.data.id}`;
      }
    } catch (err) { console.error(err); }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { class: string; label: string }> = {
      DRAFT: { class: 'badge-info', label: '📝 Brouillon' },
      PENDING_SIGNATURES: { class: 'badge-warning', label: '✍️ En attente de signatures' },
      SIGNED: { class: 'badge-success', label: '✅ Signé' },
      IN_PROGRESS: { class: 'badge-primary', label: '🚛 En cours' },
      COMPLETED: { class: 'badge-success', label: '🎉 Complété' },
      CANCELLED: { class: 'badge-danger', label: '❌ Annulé' },
    };
    return map[status] || { class: 'badge-info', label: status };
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📝 Contrats</h1>
          <p className="page-subtitle">Gestion de vos contrats de matières secondaires</p>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: '160px', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📝</div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
            Aucun contrat
          </h3>
          <p>Les contrats sont générés automatiquement lorsqu&apos;un match est confirmé.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {contracts.map((contract: any, i: number) => {
            const statusInfo = getStatusBadge(contract.status);
            const isSeller = user?.companyId === contract.sellerCompanyId;
            const needsMySignature = contract.status === 'PENDING_SIGNATURES' && (
              (isSeller && !contract.sellerSigned) || (!isSeller && !contract.buyerSigned)
            );

            return (
              <div key={contract.id} className="neo-card animate-fade-in" style={{
                padding: '24px',
                animationDelay: `${i * 100}ms`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 700 }}>
                        {contract.match?.listing?.title || 'Contrat'}
                      </h3>
                      <span className={`badge ${statusInfo.class}`}>{statusInfo.label}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                      <span>🏭 {contract.sellerCompany?.name}</span>
                      <span>→</span>
                      <span>🏪 {contract.buyerCompany?.name}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '24px', fontSize: '0.85rem' }}>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)' }}>Volume : </span>
                        <span style={{ fontWeight: 600 }}>
                          {contract.volumeEngagedKg >= 1000
                            ? `${(contract.volumeEngagedKg / 1000).toFixed(1)}t`
                            : `${contract.volumeEngagedKg}kg`}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)' }}>Prix/kg : </span>
                        <span style={{ fontWeight: 600, color: '#f59e0b' }}>{contract.pricePerKg?.toFixed(2)}€</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)' }}>Total : </span>
                        <span style={{ fontWeight: 700, color: 'var(--color-primary-400)' }}>{contract.totalPrice?.toFixed(0)}€</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)' }}>Durée : </span>
                        <span style={{ fontWeight: 600 }}>{contract.durationMonths} mois</span>
                      </div>
                    </div>

                    {/* Signature status */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                      <span className={`badge ${contract.sellerSigned ? 'badge-success' : 'badge-warning'}`}>
                        Vendeur : {contract.sellerSigned ? '✅ Signé' : '⏳ En attente'}
                      </span>
                      <span className={`badge ${contract.buyerSigned ? 'badge-success' : 'badge-warning'}`}>
                        Acheteur : {contract.buyerSigned ? '✅ Signé' : '⏳ En attente'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                    {needsMySignature && (
                      <button
                        className="btn-primary"
                        style={{ padding: '10px 20px', fontSize: '0.85rem' }}
                        onClick={() => handleSign(contract.id)}
                      >
                        ✍️ Signer
                      </button>
                    )}
                    {contract.status === 'SIGNED' && (
                      <button
                        className="btn-primary"
                        style={{ padding: '10px 20px', fontSize: '0.85rem' }}
                        onClick={() => handleCreatePassport(contract.id)}
                      >
                        📦 Créer passeport
                      </button>
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
