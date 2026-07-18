'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts';

const CAT_META: Record<string, { label: string; color: string }> = {
  BIOMASS: { label: 'Biomasse', color: '#34d399' },
  METALS: { label: 'Métaux', color: '#94a3b8' },
  PLASTICS: { label: 'Plastiques', color: '#60a5fa' },
  TEXTILE: { label: 'Textile', color: '#c084fc' },
  WOOD: { label: 'Bois', color: '#fbbf24' },
  CHEMICALS: { label: 'Chimie', color: '#f87171' },
  CHEMICAL: { label: 'Chimie', color: '#f87171' },
  GLASS: { label: 'Verre', color: '#22d3ee' },
  PAPER: { label: 'Papier', color: '#a3e635' },
  CONSTRUCTION: { label: 'BTP', color: '#f97316' },
  ELECTRONIC: { label: 'DEEE', color: '#ec4899' },
  THERMAL: { label: 'Thermique', color: '#fb923c' },
};

const meta = (cat: string) => CAT_META[cat] || { label: cat || 'Autre', color: '#64748b' };

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const cardStyle: React.CSSProperties = {
  background: '#0f1729', border: '1.5px solid #1a2540', borderRadius: 16, padding: 20,
};
const titleStyle: React.CSSProperties = {
  fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
};

function ChartTooltip({ active, payload, label, suffix }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: '#0a0f1e', border: '1px solid #1a2540', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#e2e8f0' }}>
      {label && <div style={{ color: '#94a3b8', marginBottom: 2 }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color || p.payload?.color || '#34d399' }}>
          {p.name}: <strong>{p.value}{suffix || ''}</strong>
        </div>
      ))}
    </div>
  );
}

// --- PREMIUM MOCK DATA FOR CHARTS ---
const MOCK_MY_LISTINGS = [
  { materialCategory: 'METALS', volumeKg: 4500, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() },
  { materialCategory: 'PLASTICS', volumeKg: 12000, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() },
  { materialCategory: 'BIOMASS', volumeKg: 25000, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() },
  { materialCategory: 'METALS', volumeKg: 3200, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString() },
  { materialCategory: 'ELECTRONIC', volumeKg: 800, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString() },
  { materialCategory: 'GLASS', volumeKg: 5000, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString() },
  { materialCategory: 'PAPER', volumeKg: 1500, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString() },
  { materialCategory: 'PLASTICS', volumeKg: 3000, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString() },
];
// ------------------------------------

export default function DashboardCharts() {
  const [listings, setListings] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.getMyListings()
      .then((r) => {
        const data = r.data || [];
        setListings(data.length > 0 ? data : MOCK_MY_LISTINGS);
      })
      .catch(() => setListings(MOCK_MY_LISTINGS))
      .finally(() => setLoaded(true));
  }, []);

  // Répartition par catégorie (nombre)
  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of listings) map[l.materialCategory] = (map[l.materialCategory] || 0) + 1;
    return Object.entries(map).map(([cat, value]) => ({ name: meta(cat).label, value, color: meta(cat).color }));
  }, [listings]);

  // Volume total (tonnes) par catégorie
  const volumeByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of listings) map[l.materialCategory] = (map[l.materialCategory] || 0) + (l.volumeKg || 0);
    return Object.entries(map)
      .map(([cat, kg]) => ({ name: meta(cat).label, volume: Math.round((kg / 1000) * 10) / 10, color: meta(cat).color }))
      .sort((a, b) => b.volume - a.volume);
  }, [listings]);

  // Évolution : annonces créées par mois (6 derniers mois)
  const monthly = useMemo(() => {
    const now = new Date();
    const buckets: { key: string; label: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTHS_FR[d.getMonth()], count: 0 });
    }
    for (const l of listings) {
      if (!l.createdAt) continue;
      const d = new Date(l.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const b = buckets.find((x) => x.key === key);
      if (b) b.count++;
    }
    return buckets;
  }, [listings]);

  if (loaded && listings.length === 0) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', padding: 32, marginBottom: 32 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>Les analytics apparaîtront ici dès votre première annonce.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 32 }}>
      {/* Pie — répartition par catégorie */}
      <div style={cardStyle}>
        <div style={titleStyle}>🧬 Répartition par catégorie</div>
        <ResponsiveContainer width="100%" height={230}>
          <PieChart>
            <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} stroke="none">
              {byCategory.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 8 }}>
          {byCategory.map((e, i) => (
            <span key={i} style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: e.color, display: 'inline-block' }} /> {e.name}
            </span>
          ))}
        </div>
      </div>

      {/* Bar — volume par catégorie */}
      <div style={cardStyle}>
        <div style={titleStyle}>⚖️ Volume par catégorie (tonnes)</div>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={volumeByCategory} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#1a2540' }} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip suffix=" t" />} cursor={{ fill: 'rgba(16,185,129,0.06)' }} />
            <Bar dataKey="volume" name="Volume" radius={[6, 6, 0, 0]}>
              {volumeByCategory.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Area — évolution mensuelle */}
      <div style={cardStyle}>
        <div style={titleStyle}>📈 Annonces créées / mois</div>
        <ResponsiveContainer width="100%" height={230}>
          <AreaChart data={monthly} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#1a2540' }} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#10b981', strokeWidth: 1 }} />
            <Area type="monotone" dataKey="count" name="Annonces" stroke="#10b981" strokeWidth={2} fill="url(#areaGreen)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
