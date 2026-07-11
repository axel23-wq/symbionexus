'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { waLink, CONTACT_PHONE_INTL } from '@/lib/contact';
import { useTranslation } from '@/lib/i18n/LanguageProvider';

export default function ContractsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<'sign' | 'passport' | null>(null);

  const loadContracts = useCallback(async () => {
    try {
      const result = await api.getMyContracts();
      setContracts(result.data || []);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { loadContracts(); }, [loadContracts]);

  const handleSign = async (id: string) => {
    setBusyId(id); setBusyAction('sign');
    try {
      await api.signContract(id);
      await loadContracts();
    } catch (err) { console.error(err); }
    finally { setBusyId(null); setBusyAction(null); }
  };

  const handleCreatePassport = async (contractId: string) => {
    setBusyId(contractId); setBusyAction('passport');
    try {
      // Backend idempotent : réutilise le passeport existant, sinon le crée.
      const result = await api.createPassport(contractId);
      const pid = result?.data?.id;
      if (pid) { window.location.href = `/passports/${pid}`; return; }
    } catch (err) { console.error(err); }
    setBusyId(null); setBusyAction(null);
  };

  const getStatusBadge = (status: string) => {
    const meta: Record<string, { class: string; icon: string }> = {
      DRAFT: { class: 'badge-info', icon: '📝' },
      PENDING_SIGNATURES: { class: 'badge-warning', icon: '✍️' },
      SIGNED: { class: 'badge-success', icon: '✅' },
      IN_PROGRESS: { class: 'badge-primary', icon: '🚛' },
      COMPLETED: { class: 'badge-success', icon: '🎉' },
      CANCELLED: { class: 'badge-danger', icon: '❌' },
    };
    const m = meta[status];
    if (!m) return { class: 'badge-info', label: status };
    return { class: m.class, label: `${m.icon} ${t('ctr.status.' + status)}` };
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📝 {t('ctr.title')}</h1>
          <p className="page-subtitle">{t('ctr.subtitle')}</p>
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
            {t('ctr.empty')}
          </h3>
          <p>{t('ctr.emptyDesc')}</p>
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
                        {contract.match?.listing?.title || t('ctr.contract')}
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
                        <span style={{ color: 'var(--color-text-muted)' }}>{t('ctr.volume')} : </span>
                        <span style={{ fontWeight: 600 }}>
                          {contract.volumeEngagedKg >= 1000
                            ? `${(contract.volumeEngagedKg / 1000).toFixed(1)}t`
                            : `${contract.volumeEngagedKg}kg`}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)' }}>{t('ctr.pricePerKg')} : </span>
                        <span style={{ fontWeight: 600, color: '#f59e0b' }}>{contract.pricePerKg} FCFA</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)' }}>{t('ctr.total')} : </span>
                        <span style={{ fontWeight: 700, color: 'var(--color-primary-400)' }}>{contract.totalPrice?.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)' }}>{t('ctr.duration')} : </span>
                        <span style={{ fontWeight: 600 }}>{contract.durationMonths} {t('ctr.months')}</span>
                      </div>
                    </div>

                    {/* Signature status */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                      <span className={`badge ${contract.sellerSigned ? 'badge-success' : 'badge-warning'}`}>
                        {t('ctr.seller')} : {contract.sellerSigned ? '✅ ' + t('ctr.signed') : '⏳ ' + t('ctr.pending')}
                      </span>
                      <span className={`badge ${contract.buyerSigned ? 'badge-success' : 'badge-warning'}`}>
                        {t('ctr.buyer')} : {contract.buyerSigned ? '✅ ' + t('ctr.signed') : '⏳ ' + t('ctr.pending')}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                    {needsMySignature && (
                      <button
                        className="btn-primary"
                        style={{ padding: '10px 20px', fontSize: '0.85rem' }}
                        disabled={busyId === contract.id}
                        onClick={() => handleSign(contract.id)}
                      >
                        {busyId === contract.id && busyAction === 'sign' ? '⏳ ' + t('ctr.signing') : '✍️ ' + t('ctr.sign')}
                      </button>
                    )}
                    {contract.status === 'SIGNED' && (
                      <button
                        className="btn-primary"
                        style={{ padding: '10px 20px', fontSize: '0.85rem' }}
                        disabled={busyId === contract.id}
                        onClick={() => handleCreatePassport(contract.id)}
                      >
                        {busyId === contract.id && busyAction === 'passport' ? '⏳ ' + t('ctr.creating') : '📦 ' + t('ctr.createPassport')}
                      </button>
                    )}
                    {(contract.status === 'SIGNED' || contract.status === 'IN_PROGRESS' || contract.status === 'COMPLETED') && (
                      <a
                        href={waLink(`Bonjour, je souhaite régler mon contrat SymbioNexus « ${contract.match?.listing?.title || contract.id} » — Total ${contract.totalPrice?.toLocaleString('fr-FR')} FCFA — par Mobile Money (Orange Money ${CONTACT_PHONE_INTL}).`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none', textAlign: 'center', padding: '10px 20px', fontSize: '0.85rem', fontWeight: 600, borderRadius: 12, background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', whiteSpace: 'nowrap' }}
                      >
                        💳 {t('ctr.pay')}
                      </a>
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
