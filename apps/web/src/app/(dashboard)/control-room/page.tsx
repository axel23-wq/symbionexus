'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/api';

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1').replace('/api/v1', '');
const fcfa = (n: number) => `${Math.round(n || 0).toLocaleString('fr-FR')} FCFA`;

// Couleur par famille d'événement.
const EVENT_COLOR = (t: string) =>
  t.startsWith('Payout') || t.includes('Payment') || t.includes('Wallet') ? '#34d399'
  : t.startsWith('Vision') || t.includes('Media') || t.includes('Price') ? '#a78bfa'
  : t.startsWith('Carbon') ? '#22d3ee'
  : t.includes('Weight') || t.includes('Collector') || t.includes('Pickup') || t.includes('Waste') ? '#f59e0b'
  : '#94a3b8';

export default function ControlRoomPage() {
  const [stats, setStats] = useState<any>(null);
  const [feed, setFeed] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const load = useCallback(async () => {
    try { const r = await api.getAnalytics(); setStats(r.data); if (!feed.length) setFeed(r.data.recentEvents || []); }
    catch (e) { console.error(e); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    const s = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = s;
    // Flux live : chaque event backend s'affiche instantanément.
    s.on('event:live', (evt: any) => setFeed((prev) => [{ ...evt, _k: Math.random() }, ...prev].slice(0, 60)));
    // Agrégats recalculés sur signal event-driven (pas de polling).
    s.on('analytics:update', () => load());
    return () => { s.disconnect(); };
  }, [load]);

  const metric = (label: string, value: string, color: string) => (
    <div className="neo-card" style={{ padding: 18 }}>
      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">🛰️ Salle de contrôle temps réel</h1>
          <p className="page-subtitle">Événements live, paiements, analyses IA, collectes, carbone — pilotés par events, sans rafraîchissement.</p>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#34d399' }}>
          <span style={{ width: 8, height: 8, borderRadius: 8, background: '#34d399', boxShadow: '0 0 8px #34d399' }} /> LIVE
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 20 }}>
        {metric('Collectes', String(stats?.collectionsTotal ?? '—'), '#e2e8f0')}
        {metric('Crédité wallets', fcfa(stats?.creditedTotal ?? 0), '#34d399')}
        {metric('Décaissé (confirmé)', fcfa(stats?.payoutConfirmedTotal ?? 0), '#f59e0b')}
        {metric('CO₂ évité', `${stats?.co2Total ?? 0} kg`, '#22d3ee')}
        {metric('Analyses IA', String(stats?.aiAnalyses ?? '—'), '#a78bfa')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20 }}>
        {/* Répartition collectes par statut */}
        <div className="neo-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Collectes par statut</h3>
          {(stats?.collectionsByStatus || []).map((s: any) => (
            <div key={s.status} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a2540', fontSize: 13 }}>
              <span style={{ color: '#94a3b8' }}>{s.status}</span><span style={{ fontWeight: 700 }}>{s.count}</span>
            </div>
          ))}
          {!stats?.collectionsByStatus?.length && <p style={{ color: '#64748b', fontSize: 13 }}>—</p>}
        </div>

        {/* Flux d'événements live */}
        <div className="neo-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Flux d&apos;événements <span style={{ fontSize: 11, color: '#64748b' }}>(temps réel)</span></h3>
          <div style={{ maxHeight: 460, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {feed.map((e, i) => (
              <div key={e._k || e.id || i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 10, alignItems: 'center', padding: '7px 10px', borderRadius: 8, background: '#0c1527', fontSize: 12 }}>
                <span style={{ width: 7, height: 7, borderRadius: 7, background: EVENT_COLOR(e.type) }} />
                <span style={{ fontWeight: 700, color: EVENT_COLOR(e.type) }}>{e.type}</span>
                <span style={{ color: '#475569', fontSize: 10 }}>{e.createdAt ? new Date(e.createdAt).toLocaleTimeString('fr-FR') : ''}</span>
              </div>
            ))}
            {!feed.length && <p style={{ color: '#64748b', fontSize: 13 }}>En attente d&apos;événements…</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
