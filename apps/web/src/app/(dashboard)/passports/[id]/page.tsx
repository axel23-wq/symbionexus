'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import SignatureField, { SignaturePadHandle } from '@/components/SignatureField';
import { CONTACT_TEL, CONTACT_PHONE_INTL, waLink } from '@/lib/contact';

const STATUS_META: Record<string, { label: string; icon: string; hint: string }> = {
  CREATED: { label: 'Passeport créé', icon: '📝', hint: 'Document émis' },
  PICKED_UP: { label: 'Matière enlevée', icon: '🏭', hint: 'Collecte effectuée' },
  IN_TRANSIT: { label: 'En transit', icon: '🚛', hint: 'En route' },
  NEAR_DESTINATION: { label: 'En approche', icon: '📡', hint: 'Proche du site' },
  DELIVERED: { label: 'Livré sur site', icon: '📥', hint: 'Livraison faite' },
  CONFIRMED: { label: 'Réception confirmée', icon: '✅', hint: 'Clôturé + crédit CO₂' },
};

export default function PassportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [passport, setPassport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [photo, setPhoto] = useState<string>('');
  const [savingProof, setSavingProof] = useState(false);
  const [proofDone, setProofDone] = useState(false);
  const sigRef = useRef<SignaturePadHandle>(null);

  const downloadPdf = async () => {
    setPdfLoading(true);
    try { await api.downloadPassportPdf(id); } catch (e) { console.error(e); } finally { setPdfLoading(false); }
  };

  const onPhoto = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { if (typeof e.target?.result === 'string') setPhoto(e.target.result); };
    reader.readAsDataURL(file);
  };

  const saveProof = async () => {
    const signature = sigRef.current?.toDataURL() || undefined;
    if (!signature && !photo) return;
    setSavingProof(true);
    try {
      await api.savePassportProof(id, { signature, photo: photo || undefined });
      setProofDone(true);
      loadPassport();
    } catch (e) { console.error(e); } finally { setSavingProof(false); }
  };

  const loadPassport = useCallback(async () => {
    try {
      const result = await api.getPassport(id);
      setPassport(result.data);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  }, [id]);

  useEffect(() => { loadPassport(); }, [loadPassport]);

  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2600); };

  const handleUpdateStatus = async (status: string) => {
    setUpdatingStatus(status);
    try {
      await api.updateTransportStatus(id, status);
      // Génération automatique du crédit carbone à la confirmation
      if (status === 'CONFIRMED') {
        await api.generateCarbonCredit(id);
      }
      await loadPassport();
      showToast(`✓ ${STATUS_META[status]?.label ?? status}`);
    } catch (err) {
      console.error(err);
      showToast('⚠ Échec de la mise à jour');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);

  const verifyUrl = typeof window !== 'undefined' ? `${window.location.origin}/verify/${id}` : `/verify/${id}`;
  const copyVerifyLink = () => {
    navigator.clipboard?.writeText(verifyUrl).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1600); });
  };

  const statusOrder = ['CREATED', 'PICKED_UP', 'IN_TRANSIT', 'NEAR_DESTINATION', 'DELIVERED', 'CONFIRMED'];

  if (isLoading) return <div className="spinner" style={{ margin: '80px auto' }} />;
  if (!passport) return <div style={{ textAlign: 'center', padding: '80px' }}>Passeport non trouvé.</div>;

  const currentStatusIndex = statusOrder.indexOf(passport.transportStatus);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <div className="badge badge-primary" style={{ marginBottom: '12px' }}>Passeport {passport.id}</div>
          <h1 className="page-title">{passport.contract?.match?.listing?.title}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={downloadPdf}
            disabled={pdfLoading}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
          >
            {pdfLoading ? '⏳ Génération…' : '📄 Télécharger le passeport'}
          </button>
          {passport.qrCodeData && (
            <button
              type="button"
              onClick={() => setShowQr(true)}
              title="Vérifier / partager ce passeport"
              style={{ padding: 0, border: 'none', background: 'none', cursor: 'pointer', position: 'relative', lineHeight: 0 }}
            >
              <img src={passport.qrCodeData} alt="QR Code de vérification" style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', border: '2px solid white', display: 'block' }} />
              <span style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', fontSize: 9, fontWeight: 700, color: '#2dd4bf', background: '#0a1128', padding: '1px 6px', borderRadius: 6, whiteSpace: 'nowrap' }}>🔎 Vérifier</span>
            </button>
          )}
        </div>
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

          {/* 🎮 Panneau de contrôle du transport — interactif & responsive */}
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.05em' }}>🎮 Contrôle du transport</h3>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Étape {Math.min(currentStatusIndex + 1, statusOrder.length)}/{statusOrder.length}</span>
            </div>

            {/* Barre de progression */}
            <div style={{ height: 6, borderRadius: 6, background: 'var(--color-bg-elevated)', overflow: 'hidden', marginBottom: 18 }}>
              <div style={{ height: '100%', width: `${((currentStatusIndex + 1) / statusOrder.length) * 100}%`, background: 'var(--gradient-primary)', transition: 'width .4s ease' }} />
            </div>

            {/* Étapes cliquables */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {statusOrder.map((status, i) => {
                const reached = i <= currentStatusIndex;
                const isNext = i === currentStatusIndex + 1;
                const loading = updatingStatus === status;
                const locked = i > currentStatusIndex + 1;
                const meta = STATUS_META[status];
                return (
                  <button
                    key={status}
                    onClick={() => handleUpdateStatus(status)}
                    disabled={reached || updatingStatus !== null || locked}
                    title={meta?.hint}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 20,
                      fontSize: 12, fontWeight: 600,
                      cursor: reached || locked || updatingStatus ? 'default' : 'pointer',
                      border: `1.5px solid ${reached ? 'rgba(16,185,129,0.5)' : isNext ? 'rgba(45,212,191,0.6)' : 'var(--border-subtle)'}`,
                      background: reached ? 'rgba(16,185,129,0.12)' : isNext ? 'rgba(45,212,191,0.10)' : 'transparent',
                      color: reached ? '#34d399' : isNext ? '#5eead4' : 'var(--color-text-muted)',
                      opacity: locked ? 0.45 : 1, transition: 'all .2s',
                    }}
                  >
                    <span>{loading ? '⏳' : reached ? '✓' : meta?.icon}</span>
                    <span>{meta?.label ?? status}</span>
                  </button>
                );
              })}
            </div>

            {/* Avance automatique */}
            {currentStatusIndex < statusOrder.length - 1 ? (
              <button
                onClick={() => handleUpdateStatus(statusOrder[currentStatusIndex + 1])}
                disabled={updatingStatus !== null}
                className="btn-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {updatingStatus ? '⏳ Mise à jour…' : `▶ Passer à : ${STATUS_META[statusOrder[currentStatusIndex + 1]]?.label}`}
              </button>
            ) : (
              <div style={{ textAlign: 'center', padding: '10px', borderRadius: 12, background: 'rgba(16,185,129,0.10)', color: '#34d399', fontSize: 13, fontWeight: 600 }}>
                ✅ Transport terminé — réception confirmée
              </div>
            )}
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

          {/* Preuve de livraison (PoD) — dès l'étape "Livré" */}
          {currentStatusIndex >= statusOrder.indexOf('DELIVERED') && (
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
                ✍️ Preuve de livraison
              </h3>
              {(passport.deliverySignature || passport.deliveryPhotoUrl || proofDone) ? (
                <div style={{ fontSize: '0.85rem', color: '#34d399' }}>
                  ✅ Preuve enregistrée{passport.deliveryProofAt ? ` — ${new Date(passport.deliveryProofAt).toLocaleString('fr-FR')}` : ''}
                  {passport.deliveryPhotoUrl && (
                    <img src={passport.deliveryPhotoUrl} alt="Preuve de livraison" style={{ width: '100%', borderRadius: 10, marginTop: 12, border: '1px solid var(--border-subtle)' }} />
                  )}
                </div>
              ) : (
                <>
                  <label style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'block', marginBottom: 8 }}>Signature du réceptionnaire</label>
                  <SignatureField ref={sigRef} />
                  <button type="button" onClick={() => sigRef.current?.clear()} style={{ marginTop: 8, fontSize: 12, background: 'none', border: '1px solid var(--border-subtle)', color: 'var(--color-text-muted)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>Effacer</button>
                  <label style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'block', margin: '16px 0 8px' }}>Photo de livraison</label>
                  <input type="file" accept="image/*" onChange={(e) => onPhoto(e.target.files?.[0])} style={{ fontSize: 12, color: 'var(--color-text-secondary)' }} />
                  {photo && <img src={photo} alt="Aperçu" style={{ width: '100%', borderRadius: 10, marginTop: 10, border: '1px solid var(--border-subtle)' }} />}
                  <button type="button" onClick={saveProof} disabled={savingProof} className="btn-primary" style={{ marginTop: 16, width: '100%' }}>
                    {savingProof ? '⏳ Enregistrement…' : '💾 Valider la livraison'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* 🆘 SOS Incident transport (matières dangereuses) — appel / WhatsApp direct */}
          <div className="glass-card" style={{ padding: '20px', border: '1.5px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.05)' }}>
            <h3 style={{ fontSize: '0.9rem', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              🆘 Incident transport
            </h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 14 }}>
              Déversement, accident, fuite ? Alertez immédiatement le support.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={CONTACT_TEL} style={{ flex: 1, textAlign: 'center', textDecoration: 'none', padding: '10px', borderRadius: 10, background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', fontSize: 13, fontWeight: 600 }}>
                📞 Appeler
              </a>
              <a href={waLink(`🆘 INCIDENT TRANSPORT — Passeport ${passport.id} (${passport.contract?.match?.listing?.materialType || 'matière'}). Merci de me rappeler d'urgence.`)} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', padding: '10px', borderRadius: 10, background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', fontSize: 13, fontWeight: 600 }}>
                💬 WhatsApp
              </a>
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 10, textAlign: 'center' }}>{CONTACT_PHONE_INTL}</div>
          </div>
        </div>
      </div>

      {/* Modale QR — vérification / partage */}
      {showQr && (
        <div onClick={() => setShowQr(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(4,8,16,0.75)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#0f1729', border: '1.5px solid #1a2540', borderRadius: 20, padding: 28, width: '100%', maxWidth: 360, textAlign: 'center', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>🔎 Vérifier ce passeport</h3>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 18 }}>Scannez le QR ou partagez le lien de vérification public.</p>
            <img src={passport.qrCodeData} alt="QR Code" style={{ width: 220, height: 220, borderRadius: 12, border: '5px solid #fff', background: '#fff' }} />
            <div style={{ fontSize: 11, color: '#475569', margin: '14px 0', wordBreak: 'break-all' }}>{verifyUrl}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={passport.qrCodeData} download={`qr-${passport.id}.png`} style={{ flex: 1, textDecoration: 'none', padding: '10px', borderRadius: 10, border: '1.5px solid #1a2540', color: '#cbd5e1', fontSize: 12, fontWeight: 600 }}>⬇ QR</a>
              <button type="button" onClick={copyVerifyLink} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #1a2540', background: 'none', color: copied ? '#34d399' : '#cbd5e1', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{copied ? '✓ Copié' : '🔗 Lien'}</button>
              <a href={`/verify/${passport.id}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textDecoration: 'none', padding: '10px', borderRadius: 10, background: 'var(--gradient-primary)', color: '#fff', fontSize: 12, fontWeight: 600 }}>Ouvrir</a>
            </div>
            <button type="button" onClick={() => setShowQr(false)} style={{ marginTop: 14, background: 'none', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer' }}>Fermer</button>
          </div>
        </div>
      )}

      {/* Toast de confirmation (feedback responsive) */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 2000,
          background: '#0f1729', border: '1.5px solid rgba(16,185,129,0.5)', color: '#e2e8f0',
          padding: '12px 22px', borderRadius: 14, fontSize: 14, fontWeight: 600,
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
