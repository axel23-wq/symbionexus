'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/api';
import { CATEGORY_INFO } from '@/lib/categoryInfo';
import { useTranslation } from '@/lib/i18n/LanguageProvider';

const PRICE_FCFA: Record<string, number> = {
  METALS: 665, PLASTICS: 265, BIOMASS: 65, WOOD: 55,
  TEXTILE: 180, OILS: 38, GLASS: 43, CHEMICAL: 425,
};
const CATS = Object.keys(PRICE_FCFA);
const fcfa = (n: number) => `${Math.round(n || 0).toLocaleString('fr-FR')} FCFA`;
const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1').replace('/api/v1', '');

const STATUS_COLOR: Record<string, string> = {
  SUBMITTED: '#94a3b8', ASSIGNED: '#3b82f6', EN_ROUTE: '#f59e0b',
  PICKED_UP: '#0ea5e9', VALIDATED: '#14b8a6', PAID: '#10b981', REJECTED: '#ef4444',
};
const PAYOUT_COLOR: Record<string, string> = {
  PENDING: '#94a3b8', PROCESSING: '#f59e0b', CONFIRMED: '#10b981', FAILED: '#ef4444',
};

export default function CitizenPage() {
  const { t } = useTranslation();
  const [cat, setCat] = useState('PLASTICS');
  const [weight, setWeight] = useState(5);
  const [phone, setPhone] = useState('');
  const [requests, setRequests] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [ai, setAi] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [photo, setPhoto] = useState<string>('');
  const [visionPct, setVisionPct] = useState(0);
  const [visionStage, setVisionStage] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLInputElement | null>(null);

  const pricePerKg = PRICE_FCFA[cat] || 0;
  const value = useMemo(() => Math.max(0, weight) * pricePerKg, [weight, pricePerKg]);
  const showToast = (m: string) => { setToast(m); window.setTimeout(() => setToast(''), 2600); };

  const load = useCallback(async () => {
    try {
      const [r, w, p] = await Promise.all([api.getMyCollections(), api.getWallet(), api.getMyPayouts()]);
      setRequests(r.data || []);
      setWallet(w.data || null);
      setPayouts(p.data || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    load(); // hydratation unique au montage (pas de polling)
    let myId: string | null = null;
    try { myId = JSON.parse(localStorage.getItem('user') || '{}').id || null; } catch {}
    const s = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = s;

    // PUSH pur : l'event backend porte l'état, on l'applique directement (aucun refetch).
    s.on('collection:update', (req: any) => {
      if (!req?.id || (myId && req.userId !== myId)) return;
      setRequests((prev) => {
        const i = prev.findIndex((x) => x.id === req.id);
        if (i === -1) return [req, ...prev];
        const next = [...prev]; next[i] = { ...next[i], ...req }; return next;
      });
    });

    // PUSH financier : solde + ligne de ledger poussés en direct.
    s.on('wallet:update', (w: any) => {
      if (myId && w.userId !== myId) return;
      setWallet((prev: any) => {
        const base = prev || { balance: 0, transactions: [] };
        const txs = base.transactions || [];
        const exists = w.tx && txs.some((t: any) => t.id === w.tx.id);
        return { ...base, balance: w.balance, transactions: exists ? txs : [w.tx, ...txs] };
      });
    });

    // PUSH décaissement : statut payout appliqué en direct (PENDING→PROCESSING→CONFIRMED/FAILED).
    s.on('payout:update', (p: any) => {
      if (!p?.id || (myId && p.userId !== myId)) return;
      setPayouts((prev) => {
        const i = prev.findIndex((x) => x.id === p.id);
        if (i === -1) return [p, ...prev];
        const next = [...prev]; next[i] = { ...next[i], ...p }; return next;
      });
    });

    // Progression Vision IA (photo/vidéo) en direct.
    s.on('vision:progress', (d: any) => {
      if (myId && d.userId !== myId) return;
      setVisionPct(d.pct); setVisionStage(d.stage || '');
    });

    return () => { s.disconnect(); };
  }, [load]);

  // Action = déclenche l'event backend ; l'UI se met à jour via le PUSH WebSocket (pas de reload).
  const act = async (id: string | null, fn: () => Promise<any>, msg: string) => {
    setBusy(id || 'submit');
    try { await fn(); showToast(msg); }
    catch (e: any) { console.error(e); showToast('⚠ ' + (e?.message || t('cit.fail'))); }
    finally { setBusy(null); }
  };

  // IA Vision RÉELLE : photo → backend analyse pixels → classe + estime prix (aucun mock).
  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const img = String(reader.result);
      setPhoto(img); setAnalyzing(true); setAi(null);
      try {
        const res = await api.analyzeCollection(img);
        const d = res.data;
        setAi(d);
        if (PRICE_FCFA[d.category] != null) setCat(d.category);
        setWeight(Math.max(1, Math.round(d.estimatedWeightKg)));
        showToast(`🧠 ${d.category} ${t('cit.toast.detected')}`);
      } catch (err: any) { showToast('⚠ ' + (err?.message || t('cit.toast.analyzeFailed'))); }
      finally { setAnalyzing(false); }
    };
    reader.readAsDataURL(f);
  };

  // Vidéo : keyframes FFmpeg backend → analyse IA par frame → fusion (progress temps réel).
  const onVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = async () => {
      setPhoto(''); setAi(null); setAnalyzing(true); setVisionPct(0); setVisionStage(t('cit.ai.extracting'));
      try {
        const res = await api.analyzeVideo(String(reader.result));
        const d = res.data;
        setAi(d);
        if (PRICE_FCFA[d.category] != null) setCat(d.category);
        setWeight(Math.max(1, Math.round(d.estimatedWeightKg)));
        showToast(`🎬 ${t('cit.toast.videoAnalyzed')} (${d.frames})`);
      } catch (err: any) { showToast('⚠ ' + (err?.message || t('cit.toast.videoFailed'))); }
      finally { setAnalyzing(false); }
    };
    reader.readAsDataURL(f);
  };

  const submit = () => act(null, () => api.submitCollection({ materialCategory: cat, declaredWeightKg: weight, phone: phone || undefined }), '✓ ' + t('cit.toast.created'));

  // Décaissement réel vers Mobile Money (débit wallet → prestataire → webhook).
  const doPayout = () => {
    const amt = payoutAmount || Math.floor(wallet?.balance || 0);
    if (amt < 100) { showToast('⚠ ' + t('cit.toast.minAmount')); return; }
    if (!phone || phone.trim().length < 8) { showToast('⚠ ' + t('cit.toast.phoneRequired')); return; }
    act('payout', () => api.requestPayout(amt, phone), '💸 ' + t('cit.toast.payoutInit'));
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 960, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">♻️ {t('cit.title')}</h1>
          <p className="page-subtitle">{t('cit.subtitle')}</p>
        </div>
        {wallet && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#64748b' }}>SymbioWallet</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#34d399' }}>{fcfa(wallet.balance)}</div>
          </div>
        )}
      </div>

      {/* 1. Matière + poids + estimation + création réelle */}
      <div className="neo-card" style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>{t('cit.step1')}</h3>

        {/* IA Vision réelle : photo analysée côté backend (jimp) → catégorie + prix auto */}
        <div style={{ marginBottom: 16, padding: 14, borderRadius: 12, border: '1.5px dashed rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={analyzing} className="btn-primary" style={{ padding: '10px 16px' }}>
              {analyzing ? '🧠 ' + t('cit.ai.analyzing') : '📸 ' + t('cit.ai.photo')}
            </button>
            <button type="button" onClick={() => videoRef.current?.click()} disabled={analyzing} className="btn-primary" style={{ padding: '10px 16px' }}>
              🎬 {t('cit.ai.video')}
            </button>
            <span style={{ fontSize: 11, color: '#64748b' }}>{t('cit.ai.hint')}</span>
            <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: 'none' }} />
            <input ref={videoRef} type="file" accept="video/*" onChange={onVideo} style={{ display: 'none' }} />
          </div>
          {analyzing && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                <span>{visionStage || t('cit.ai.analyzing')}</span><span>{visionPct}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 6, background: '#1a2540', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${visionPct}%`, background: 'linear-gradient(90deg,#10b981,#34d399)', transition: 'width .3s' }} />
              </div>
            </div>
          )}
          {photo && (
            <div style={{ display: 'flex', gap: 14, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="déchet" style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 10, border: '1px solid #1a2540' }} />
              {ai && (
                <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                  <div><b style={{ color: '#34d399' }}>{CATEGORY_INFO[ai.category]?.icon} {CATEGORY_INFO[ai.category]?.label || ai.category}</b> — {ai.material} · {t('cit.ai.confidence')} {(ai.confidence * 100) | 0}%</div>
                  <div style={{ color: '#94a3b8' }}>{t('cit.ai.quality')} {(ai.quality * 100) | 0}% · {t('cit.ai.recyclability')} {(ai.recyclability * 100) | 0}% · ~{ai.estimatedWeightKg} kg</div>
                  <div style={{ color: '#94a3b8' }}>{t('cit.ai.priceAI')} : {ai.pricePerKg} F/kg → <b style={{ color: '#34d399' }}>{fcfa(ai.estimatedValue)}</b></div>
                  {ai.objects?.length > 0 && (
                    <div style={{ fontSize: 11, color: '#64748b' }}>{t('cit.ai.objects')} : {ai.objects.map((o: any) => `${o.label} (${(o.confidence * 100) | 0}%)`).join(', ')}</div>
                  )}
                  {ai.contamination?.length > 0 && (
                    <div style={{ fontSize: 11, color: '#f59e0b' }}>⚠ {t('cit.ai.contamination')} : {ai.contamination.join(', ')}</div>
                  )}
                  <div style={{ fontSize: 10, color: '#475569' }}>{t('cit.ai.engine')} : {ai.provider}{ai.notes ? ` · ${ai.notes}` : ''}</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 10, marginBottom: 16 }}>
          {CATS.map((c) => {
            const i = CATEGORY_INFO[c]; const sel = c === cat;
            return (
              <button key={c} type="button" onClick={() => setCat(c)}
                style={{ padding: 10, borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                  border: `1.5px solid ${sel ? 'rgba(16,185,129,0.6)' : '#1a2540'}`,
                  background: sel ? 'rgba(16,185,129,0.08)' : '#111c30' }}>
                <div style={{ fontSize: 24 }}>{i?.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: sel ? '#34d399' : '#94a3b8' }}>{i?.label}</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>{PRICE_FCFA[c]} F/kg</div>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
          <input type="range" min={1} max={200} value={weight} onChange={(e) => setWeight(Number(e.target.value))} style={{ flex: 1, minWidth: 180, accentColor: '#10b981' }} />
          <input type="number" min={0} value={weight} onChange={(e) => setWeight(Number(e.target.value))} style={{ width: 80, padding: 8, borderRadius: 8, border: '1.5px solid #1a2540', background: '#0c1527', color: '#e2e8f0' }} />
          <span style={{ color: '#64748b' }}>{t('cit.kgTo')} </span>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#34d399' }}>~{fcfa(value)}</span>
        </div>
        <input type="tel" placeholder={t('cit.phonePlaceholder')} value={phone} onChange={(e) => setPhone(e.target.value)}
          style={{ width: '100%', padding: 12, borderRadius: 10, border: '1.5px solid #1a2540', background: '#0c1527', color: '#e2e8f0', marginBottom: 14 }} />
        <button type="button" onClick={submit} disabled={busy === 'submit'} className="btn-primary" style={{ width: '100%' }}>
          {busy === 'submit' ? '⏳ ' + t('cit.creating') : '📤 ' + t('cit.createBtn')}
        </button>
      </div>

      {/* 2. Mes demandes (réel, temps réel) */}
      <div className="neo-card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>{t('cit.step2')} <span style={{ fontSize: 11, color: '#64748b' }}>{t('cit.step2.rt')}</span></h3>
        {requests.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: 13 }}>{t('cit.noRequests')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {requests.map((r) => {
              const st = { label: t(`cit.status.${r.status}`), color: STATUS_COLOR[r.status] || '#94a3b8' };
              const info = CATEGORY_INFO[r.materialCategory];
              return (
                <div key={r.id} className="glass-card" style={{ padding: 14, display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{info?.icon} {info?.label || r.materialCategory} — {r.declaredWeightKg} kg</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                      <span style={{ color: st.color, fontWeight: 700 }}>● {st.label}</span> · {fcfa(r.finalValue ?? r.estimatedValue)}
                    </div>
                  </div>
                  {/* Contrôle démo du flux réel (event engine) */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {r.status === 'SUBMITTED' && <button className="btn-mini" disabled={busy === r.id} onClick={() => act(r.id, () => api.assignCollection(r.id), t('cit.toast.collectorAssigned'))}>{t('cit.assign')}</button>}
                    {(r.status === 'ASSIGNED' || r.status === 'EN_ROUTE' || r.status === 'PICKED_UP') && <button className="btn-mini" disabled={busy === r.id} onClick={() => act(r.id, () => api.validateCollection(r.id, r.declaredWeightKg), t('cit.toast.weightValidated'))}>{t('cit.validate')}</button>}
                    {r.status === 'VALIDATED' && <button className="btn-mini green" disabled={busy === r.id} onClick={() => act(r.id, () => api.payCollection(r.id), '💰 ' + t('cit.toast.paidWallet'))}>💰 {t('cit.pay')}</button>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Retrait Mobile Money (décaissement réel) */}
      <div className="neo-card" style={{ padding: 24, marginTop: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{t('cit.step3')}</h3>
        <p style={{ fontSize: 11, color: '#64748b', marginBottom: 14 }}>{t('cit.step3.desc')}</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
          <input type="number" min={0} placeholder={`${t('cit.amount')} (max ${Math.floor(wallet?.balance || 0)})`} value={payoutAmount || ''} onChange={(e) => setPayoutAmount(Number(e.target.value))}
            style={{ width: 180, padding: 10, borderRadius: 10, border: '1.5px solid #1a2540', background: '#0c1527', color: '#e2e8f0' }} />
          <span style={{ fontSize: 12, color: '#64748b' }}>{t('cit.toNumberAbove')}</span>
          <button type="button" onClick={doPayout} disabled={busy === 'payout'} className="btn-primary" style={{ marginLeft: 'auto', padding: '10px 18px' }}>
            {busy === 'payout' ? '⏳ ' + t('cit.sending') : '💸 ' + t('cit.withdraw')}
          </button>
        </div>
        {payouts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {payouts.map((p) => {
              const st = { label: t(`cit.payout.${p.status}`), color: PAYOUT_COLOR[p.status] || '#94a3b8' };
              return (
                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1a2540', fontSize: 13 }}>
                  <div>
                    <span style={{ fontWeight: 700 }}>{fcfa(p.amount)}</span> → {p.phone}
                    <span style={{ color: st.color, fontWeight: 700, marginLeft: 8 }}>● {st.label}</span>
                  </div>
                  {/* Outil DEV : simule le webhook prestataire tant que les clés manquent */}
                  {(p.status === 'PENDING' || p.status === 'PROCESSING') && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-mini green" onClick={() => act('payout', () => api.devConfirmPayout(p.providerRef, 'CONFIRMED'), '✅ ' + t('cit.toast.confirmed'))}>{t('cit.confirm')}</button>
                      <button className="btn-mini" onClick={() => act('payout', () => api.devConfirmPayout(p.providerRef, 'FAILED'), t('cit.toast.failSim'))}>{t('cit.fail')}</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ledger */}
      {wallet?.transactions?.length > 0 && (
        <div className="neo-card" style={{ padding: 24, marginTop: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>{t('cit.step4')}</h3>
          {wallet.transactions.map((t: any) => {
            const debit = t.type === 'PAYOUT';
            return (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1a2540', fontSize: 13 }}>
                <span style={{ color: '#94a3b8' }}>{t.type} · {new Date(t.createdAt).toLocaleString('fr-FR')}</span>
                <span style={{ fontWeight: 700, color: debit ? '#f87171' : '#34d399' }}>{debit ? '−' : '+'}{fcfa(t.amount)}</span>
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, background: '#0f1729', border: '1.5px solid rgba(16,185,129,0.5)', color: '#e2e8f0', padding: '12px 22px', borderRadius: 14, fontSize: 14, fontWeight: 600 }}>{toast}</div>
      )}

      <style>{`.btn-mini{font-size:11px;font-weight:600;padding:6px 11px;border-radius:9px;border:1.5px solid var(--border-subtle);background:transparent;color:var(--color-text-secondary);cursor:pointer}.btn-mini:hover:not(:disabled){border-color:#2a3a5a;color:#fff}.btn-mini:disabled{opacity:.5}.btn-mini.green{border-color:rgba(16,185,129,.4);color:#34d399}`}</style>
    </div>
  );
}
