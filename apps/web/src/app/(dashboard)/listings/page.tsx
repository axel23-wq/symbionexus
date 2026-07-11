'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { CATEGORY_INFO } from '@/lib/categoryInfo';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import Link from 'next/link';

// Carte chargée côté client uniquement (Leaflet utilise window)
const RealMap = dynamic(() => import('@/components/RealMap'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', fontSize: 12 }}>
      Chargement de la carte…
    </div>
  ),
});

// Noyau 3D décoratif (verre) — client-only, jamais SSR
const SymbioNode3D = dynamic(() => import('@/components/SymbioNode3D'), { ssr: false });

// ── Helper: city -> coordinates ──────────────────────────────
const getCoordsForCity = (city: string) => {
  const cityMap: Record<string, { lat: number; lon: number }> = {
    'Douala': { lat: 4.0511, lon: 9.7679 },
    'Yaoundé': { lat: 3.8480, lon: 11.5021 },
    'Bafoussam': { lat: 5.4781, lon: 10.4176 },
    'Bamenda': { lat: 5.9631, lon: 10.1591 },
    'Garoua': { lat: 9.3017, lon: 13.3921 },
    'Maroua': { lat: 10.5956, lon: 14.3247 },
    'Ngaoundéré': { lat: 7.3270, lon: 13.5847 },
    'Bertoua': { lat: 4.5774, lon: 13.6848 },
    'Kribi': { lat: 2.9391, lon: 9.9100 },
    'Ebolowa': { lat: 2.9000, lon: 11.1500 },
    'Limbe': { lat: 4.0225, lon: 9.1950 },
    'Buea': { lat: 4.1560, lon: 9.2632 },
  };
  return cityMap[city] || { lat: 4.0511, lon: 9.7679 };
};

// ── Helper: nearest city name from coordinates ───────────────
const getCityFromCoords = (lat: number, lon: number): string => {
  const cities = [
    { name: 'Douala', lat: 4.0511, lon: 9.7679 },
    { name: 'Yaoundé', lat: 3.8480, lon: 11.5021 },
    { name: 'Bafoussam', lat: 5.4781, lon: 10.4176 },
    { name: 'Bamenda', lat: 5.9631, lon: 10.1591 },
    { name: 'Garoua', lat: 9.3017, lon: 13.3921 },
    { name: 'Maroua', lat: 10.5956, lon: 14.3247 },
    { name: 'Ngaoundéré', lat: 7.3270, lon: 13.5847 },
    { name: 'Bertoua', lat: 4.5774, lon: 13.6848 },
    { name: 'Kribi', lat: 2.9391, lon: 9.9100 },
    { name: 'Ebolowa', lat: 2.9000, lon: 11.1500 },
    { name: 'Limbe', lat: 4.0225, lon: 9.1950 },
    { name: 'Buea', lat: 4.1560, lon: 9.2632 },
  ];
  let closest = cities[0];
  let minD = Infinity;
  for (const c of cities) {
    const d = Math.pow(c.lat - lat, 2) + Math.pow(c.lon - lon, 2);
    if (d < minD) { minD = d; closest = c; }
  }
  return closest.name;
};

// ── Helper: Haversine distance (km) ──────────────────────────
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ── Category badge colours ───────────────────────────────────
const catBadge = (cat: string): { color: string; background: string } => {
  switch (cat) {
    case 'BIOMASS': return { color: '#34d399', background: 'rgba(52,211,153,0.10)' };
    case 'METALS': return { color: '#cbd5e1', background: 'rgba(148,163,184,0.10)' };
    case 'TEXTILE': return { color: '#c084fc', background: 'rgba(192,132,252,0.10)' };
    case 'WOOD': return { color: '#fbbf24', background: 'rgba(251,191,36,0.10)' };
    case 'PLASTICS': return { color: '#60a5fa', background: 'rgba(96,165,250,0.10)' };
    case 'CHEMICALS':
    case 'CHEMICAL': return { color: '#f87171', background: 'rgba(248,113,113,0.10)' };
    case 'GLASS': return { color: '#22d3ee', background: 'rgba(34,211,238,0.10)' };
    case 'OILS': return { color: '#38bdf8', background: 'rgba(56,189,248,0.10)' };
    default: return { color: '#60a5fa', background: 'rgba(96,165,250,0.10)' };
  }
};

// ── Options du formulaire d'édition (alignées sur l'enum backend) ──
const CITY_NAMES = ['Douala', 'Yaoundé', 'Bafoussam', 'Bamenda', 'Garoua', 'Maroua', 'Ngaoundéré', 'Bertoua', 'Kribi', 'Ebolowa', 'Limbe', 'Buea'];
const EDIT_CATEGORIES: [string, string][] = [
  ['METALS', 'Métaux'], ['PLASTICS', 'Plastiques'], ['BIOMASS', 'Biomasse'], ['CHEMICALS', 'Chimie'],
  ['TEXTILE', 'Textile'], ['CONSTRUCTION', 'BTP'], ['THERMAL', 'Thermique'], ['GLASS', 'Verre'],
  ['PAPER', 'Papier / Carton'], ['ELECTRONIC', 'DEEE'],
];
const EDIT_FREQ: [string, string][] = [
  ['ON_DEMAND', 'À la demande'], ['DAILY', 'Quotidien'], ['WEEKLY', 'Hebdomadaire'],
  ['BIWEEKLY', 'Bimensuel'], ['MONTHLY', 'Mensuel'], ['QUARTERLY', 'Trimestriel'],
];

const emptyEditForm = {
  title: '', materialType: '', materialCategory: 'BIOMASS', description: '',
  volumeKg: 0 as number | string, frequency: 'MONTHLY', pricePerKg: 0 as number | string, city: 'Douala',
};

export default function MyListingsPage() {
  const { t } = useTranslation();
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'category' | 'location' | 'tarification' | 'publication'>('category');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchRadius, setSearchRadius] = useState<number | null>(200);
  const [priceMin, setPriceMin] = useState<number | string>('');
  const [priceMax, setPriceMax] = useState<number | string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'price_desc' | 'price_asc' | 'volume_desc' | 'matches_desc'>('recent');
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const loadListings = useCallback(async () => {
    try {
      const result = await api.getMyListings();
      setListings(result.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadListings(); }, [loadListings]);

  const handlePublish = async (id: string) => {
    try {
      await api.publishListing(id);
      loadListings();
    } catch (err) {
      console.error(err);
    }
  };

  // ── Duplication (clone en brouillon) ───────────────────────
  const handleDuplicate = async (l: any) => {
    setDuplicatingId(l.id);
    try {
      await api.createListing({
        title: `${l.title} (copie)`,
        materialType: l.materialType || 'N/A',
        materialCategory: l.materialCategory,
        description: l.description || '',
        volumeKg: Number(l.volumeKg) || 1,
        frequency: l.frequency,
        pricePerKg: l.pricePerKg != null ? Number(l.pricePerKg) : undefined,
        latitude: l.latitude,
        longitude: l.longitude,
        chemicalProfile: l.chemicalProfile || undefined,
      });
      loadListings();
    } catch (err) {
      console.error(err);
    } finally {
      setDuplicatingId(null);
    }
  };

  // ── Suppression (avec confirmation) ────────────────────────
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingTitle, setDeletingTitle] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const askDelete = (l: any) => { setDeleteError(''); setDeletingTitle(l.title || ''); setDeletingId(l.id); };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await api.deleteListing(deletingId);
      setDeletingId(null);
      setIsDeleting(false);
      loadListings();
    } catch (err) {
      console.error(err);
      setDeleteError(err instanceof Error ? err.message : t('myl.err.delete'));
      setIsDeleting(false);
    }
  };

  // ── Édition (modale) ───────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyEditForm });
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const openEdit = (l: any) => {
    setEditError('');
    setEditForm({
      title: l.title || '',
      materialType: l.materialType || '',
      materialCategory: l.materialCategory || 'BIOMASS',
      description: l.description || '',
      volumeKg: l.volumeKg ?? 0,
      frequency: l.frequency || 'MONTHLY',
      pricePerKg: l.pricePerKg ?? 0,
      city: getCityFromCoords(l.latitude, l.longitude),
    });
    setEditingId(l.id);
  };

  const closeEdit = () => { setEditingId(null); setIsSaving(false); };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSave = async () => {
    if (!editingId) return;
    setIsSaving(true);
    setEditError('');
    try {
      const coords = getCoordsForCity(editForm.city);
      await api.updateListing(editingId, {
        title: editForm.title,
        materialType: editForm.materialType,
        materialCategory: editForm.materialCategory,
        description: editForm.description,
        volumeKg: Number(editForm.volumeKg),
        frequency: editForm.frequency,
        pricePerKg: Number(editForm.pricePerKg),
        latitude: coords.lat,
        longitude: coords.lon,
      });
      closeEdit();
      loadListings();
    } catch (err: any) {
      console.error(err);
      setEditError(err?.message || t('myl.err.save'));
      setIsSaving(false);
    }
  };

  const userCity = user?.company?.companyCity || 'Douala';
  const userCoords = useMemo(() => getCoordsForCity(userCity), [userCity]);
  const getListingDistance = useCallback(
    (l: any) => haversineDistance(userCoords.lat, userCoords.lon, l.latitude, l.longitude),
    [userCoords],
  );

  const formatVolume = (kg: number) => (kg >= 1000 ? `${kg / 1000}t` : `${kg} kg`);

  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const arr = listings.filter((l) => {
      // Category
      if (selectedCategory !== 'ALL') {
        const cat = l.materialCategory;
        if (selectedCategory === 'CHEMICALS' || selectedCategory === 'CHEMICAL') {
          if (cat !== 'CHEMICALS' && cat !== 'CHEMICAL') return false;
        } else if (cat !== selectedCategory) return false;
      }
      // Proximity
      if (searchRadius !== null && getListingDistance(l) > searchRadius) return false;
      // Price
      const price = l.pricePerKg;
      if (price !== null && price !== undefined) {
        if (priceMin !== '' && price < Number(priceMin)) return false;
        if (priceMax !== '' && price > Number(priceMax)) return false;
      } else if (priceMin !== '' && Number(priceMin) > 0) return false;
      // Status
      if (statusFilter !== 'ALL' && l.status !== statusFilter) return false;
      // Text search (titre / type / description)
      if (q) {
        const hay = `${l.title || ''} ${l.materialType || ''} ${l.description || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const sorted = [...arr];
    switch (sortBy) {
      case 'price_desc': sorted.sort((a, b) => (b.pricePerKg || 0) - (a.pricePerKg || 0)); break;
      case 'price_asc': sorted.sort((a, b) => (a.pricePerKg || 0) - (b.pricePerKg || 0)); break;
      case 'volume_desc': sorted.sort((a, b) => (b.volumeKg || 0) - (a.volumeKg || 0)); break;
      case 'matches_desc': sorted.sort((a, b) => ((b._count?.matches || 0) - (a._count?.matches || 0))); break;
      default: sorted.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()); break;
    }
    return sorted;
  }, [listings, selectedCategory, searchRadius, priceMin, priceMax, statusFilter, getListingDistance, searchQuery, sortBy]);

  const tabs = [
    { id: 'category', num: 1, label: t('myl.tab.category') },
    { id: 'location', num: 2, label: t('myl.tab.location') },
    { id: 'tarification', num: 3, label: t('myl.tab.pricing') },
    { id: 'publication', num: 4, label: t('myl.tab.publication') },
  ] as const;

  const categoriesList = [
    { id: 'ALL', label: t('myl.all'), icon: '📋' },
    { id: 'METALS', label: t('cat.METALS'), icon: '⚙️' },
    { id: 'PLASTICS', label: t('cat.PLASTICS'), icon: '🧪' },
    { id: 'BIOMASS', label: t('cat.BIOMASS'), icon: '🌱' },
    { id: 'WOOD', label: t('cat.WOOD'), icon: '🌲' },
    { id: 'TEXTILE', label: t('cat.TEXTILE'), icon: '🧵' },
    { id: 'OILS', label: t('cat.OILS'), icon: '💧' },
    { id: 'GLASS', label: t('cat.GLASS'), icon: '🔮' },
    { id: 'CHEMICAL', label: t('cat.CHEMICAL'), icon: '⚗️' },
  ];

  const radiusChoices: { value: number | null; label: string }[] = [
    { value: 50, label: '50 km' },
    { value: 100, label: '100 km' },
    { value: 200, label: '200 km' },
    { value: 500, label: '500 km' },
    { value: null, label: t('myl.loc.allDist') },
  ];

  const pricePresets = [
    { min: 0, max: 100, label: '< 100 FCFA' },
    { min: 100, max: 300, label: '100 - 300 FCFA' },
    { min: 300, max: 1000, label: '300 - 1000 FCFA' },
    { min: '', max: '', label: t('myl.price.allPrices') },
  ];

  const resetAll = () => {
    setSelectedCategory('ALL');
    setSearchRadius(null);
    setPriceMin('');
    setPriceMax('');
    setStatusFilter('ALL');
  };

  const draftCount = listings.filter((l) => l.status === 'DRAFT').length;
  const pubCount = listings.filter((l) => l.status === 'PUBLISHED').length;

  // ── Statistiques (calcul client) ───────────────────────────
  const totalVolumeKg = listings.reduce((s, l) => s + (Number(l.volumeKg) || 0), 0);
  const potentialRevenue = listings.reduce((s, l) => s + (Number(l.volumeKg) || 0) * (Number(l.pricePerKg) || 0), 0);
  const totalMatches = listings.reduce((s, l) => s + (l._count?.matches || 0), 0);

  const formatFcfa = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} M FCFA` : `${Math.round(n).toLocaleString('fr-FR')} FCFA`;

  // ── Export CSV des annonces filtrées ───────────────────────
  const exportCSV = () => {
    const header = ['Titre', 'Categorie', 'Type', 'Statut', 'Volume_kg', 'Frequence', 'Prix_eur_kg', 'Ville', 'Matches'];
    const rows = filteredListings.map((l) => [
      l.title, l.materialCategory, l.materialType, l.status, l.volumeKg,
      l.frequency, l.pricePerKg ?? '', getCityFromCoords(l.latitude, l.longitude), l._count?.matches || 0,
    ]);
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((r) => r.map(esc).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mes-annonces-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <style>{`
        .ma-root { background:#0a0f1e; color:#e2e8f0; min-height:100vh; }
        .step-tab { flex:1; display:flex; align-items:center; justify-content:center; gap:12px; padding:14px 20px; border-radius:14px; border:1.5px solid #1a2540; background:#0f1729; cursor:pointer; transition:all .25s ease; user-select:none; }
        .step-tab:hover:not(.active) { border-color:#2a3a5a; background:#121d33; }
        .step-tab.active { background:rgba(16,185,129,0.08); border-color:rgba(16,185,129,0.5); }
        .step-tab .num { width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; background:#1e293b; color:#64748b; transition:all .25s ease; }
        .step-tab.active .num { background:#10b981; color:#fff; }
        .step-tab .label { font-size:14px; font-weight:500; color:#64748b; transition:color .25s; }
        .step-tab.active .label { color:#34d399; }
        .filter-panel { background:#0f1729; border:1.5px solid #1a2540; border-radius:18px; padding:26px 28px; }
        .tab-content { display:none; animation:fadeIn .3s ease; }
        .tab-content.active { display:block; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .cat-btn { display:flex; flex-direction:column; align-items:center; gap:8px; padding:10px 10px 12px; border-radius:14px; border:1.5px solid #1a2540; background:#111c30; cursor:pointer; transition:all .2s; min-width:0; overflow:hidden; }
        .cat-btn:hover:not(.selected) { border-color:#2a3a5a; background:#152035; transform:translateY(-2px); }
        .cat-btn .cat-label { font-size:12px; font-weight:600; color:#94a3b8; transition:color .2s; }
        .cat-btn.selected { border-color:rgba(16,185,129,0.6); background:rgba(16,185,129,0.06); box-shadow:0 6px 18px rgba(16,185,129,0.15); }
        .cat-btn.selected .cat-label { color:#34d399; }
        /* Miniature photo réaliste (repli emoji si l'image ne charge pas) */
        .cat-thumb { position:relative; width:100%; aspect-ratio:1/1; border-radius:11px; overflow:hidden; background:linear-gradient(135deg,#152035,#0d1524); display:flex; align-items:center; justify-content:center; }
        .cat-thumb img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; transition:transform .35s ease; }
        .cat-btn:hover .cat-thumb img { transform:scale(1.08); }
        .cat-thumb-emoji { position:relative; z-index:0; font-size:26px; line-height:1; opacity:.85; }
        .cat-thumb img { z-index:1; }
        .cat-thumb::after { content:''; position:absolute; inset:0; z-index:2; background:linear-gradient(to top, rgba(10,15,30,0.35), transparent 55%); }
        /* Panneau détail catégorie */
        .cat-detail { display:grid; grid-template-columns:220px 1fr; gap:20px; margin-top:22px; background:#0c1526; border:1.5px solid #1a2540; border-radius:16px; padding:18px; }
        @media (max-width:760px) { .cat-detail { grid-template-columns:1fr; } }
        .cat-detail-img { position:relative; border-radius:12px; overflow:hidden; min-height:150px; background:linear-gradient(135deg,#152035,#0d1524); display:flex; align-items:center; justify-content:center; }
        .cat-detail-img img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:1; }
        .cat-detail-emoji { font-size:42px; opacity:.8; }
        .cat-detail-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
        .cat-detail-head h4 { font-size:18px; font-weight:800; color:#f1f5f9; }
        .cat-detail-count { font-size:12px; font-weight:700; color:#34d399; background:rgba(16,185,129,0.12); padding:4px 12px; border-radius:20px; }
        .cat-detail-desc { font-size:13px; color:#94a3b8; line-height:1.6; margin-bottom:14px; }
        .cat-detail-row { display:flex; gap:12px; align-items:flex-start; margin-bottom:10px; }
        .cat-detail-k { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:#64748b; min-width:96px; padding-top:4px; }
        .cat-detail-price { font-size:14px; font-weight:700; color:#fbbf24; }
        .cat-chips { display:flex; flex-wrap:wrap; gap:6px; }
        .cat-chip { font-size:12px; padding:4px 11px; border-radius:8px; background:#152035; border:1px solid #1a2540; color:#cbd5e1; }
        .cat-chip.green { background:rgba(16,185,129,0.10); border-color:rgba(16,185,129,0.3); color:#6ee7b7; }
        .radius-btn { padding:10px 20px; border-radius:10px; border:1.5px solid #1a2540; background:#111c30; color:#94a3b8; font-size:13px; font-weight:500; cursor:pointer; transition:all .2s; }
        .radius-btn:hover:not(.active) { border-color:#2a3a5a; color:#cbd5e1; }
        .radius-btn.active { border-color:rgba(16,185,129,0.5); background:rgba(16,185,129,0.06); color:#34d399; }
        .status-btn { display:flex; align-items:center; gap:10px; padding:12px 22px; border-radius:12px; border:1.5px solid #1a2540; background:#111c30; color:#94a3b8; font-size:13px; font-weight:500; cursor:pointer; transition:all .2s; }
        .status-btn:hover:not(.active) { border-color:#2a3a5a; color:#cbd5e1; }
        .status-btn.active { border-color:rgba(16,185,129,0.5); background:rgba(16,185,129,0.06); color:#34d399; }
        .status-btn .count { font-size:11px; padding:2px 8px; border-radius:10px; background:#1e293b; color:#64748b; font-weight:600; transition:all .2s; }
        .status-btn.active .count { background:rgba(16,185,129,0.15); color:#6ee7b7; }
        .price-btn { padding:8px 16px; border-radius:10px; border:1.5px solid #1a2540; background:#111c30; color:#64748b; font-size:12px; font-weight:500; cursor:pointer; transition:all .2s; }
        .price-btn:hover { border-color:rgba(16,185,129,0.4); color:#34d399; }
        .price-btn.active { border-color:rgba(16,185,129,0.5); background:rgba(16,185,129,0.06); color:#34d399; }
        .form-input { width:100%; background:#111c30; border:1.5px solid #1a2540; border-radius:10px; padding:12px 16px; color:#e2e8f0; font-size:13px; outline:none; transition:border-color .2s; }
        .form-input:focus { border-color:#10b981; }
        .map-container { background:#0a1628; border-radius:14px; height:200px; position:relative; overflow:hidden; border:1.5px solid #1a2540; display:flex; align-items:center; justify-content:center; }
        .map-grid { position:absolute; inset:0; opacity:0.04; background-image:repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 30px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 30px); }
        .map-dot { position:absolute; border-radius:50%; transition:all .4s ease; }
        .map-dot::after { content:''; position:absolute; inset:-4px; border-radius:50%; border:2px solid currentColor; opacity:0.3; animation:ripple 2s infinite; }
        @keyframes ripple { 0% { transform:scale(1); opacity:0.3; } 100% { transform:scale(2); opacity:0; } }
        .listing-card { background:#0f1729; border:1.5px solid #1a2540; border-radius:16px; padding:22px; transition:all .25s ease; display:flex; flex-direction:column; justify-content:space-between; }
        .listing-card:hover { border-color:rgba(16,185,129,0.3); transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.3); }
        .listing-card:hover .card-title { color:#6ee7b7; }
        .badge { font-size:11px; font-weight:700; padding:4px 12px; border-radius:8px; letter-spacing:0.02em; display:inline-block; }
        .btn-publier { flex:1; background:#10b981; color:#fff; font-weight:600; font-size:13px; padding:11px 0; border-radius:12px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:all .2s; box-shadow:0 4px 12px rgba(16,185,129,0.2); }
        .btn-publier:hover { background:#059669; transform:translateY(-1px); box-shadow:0 6px 16px rgba(16,185,129,0.3); }
        .btn-voir { width:100%; background:linear-gradient(135deg, rgba(56,189,248,0.12), rgba(59,130,246,0.12)); color:#7dd3fc; font-weight:600; font-size:13px; padding:11px 0; border-radius:12px; border:1.5px solid rgba(56,189,248,0.35); cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:all .2s; }
        .btn-voir:hover { border-color:rgba(56,189,248,0.75); color:#bae6fd; background:linear-gradient(135deg, rgba(56,189,248,0.22), rgba(59,130,246,0.22)); transform:translateY(-1px); box-shadow:0 6px 16px rgba(56,189,248,0.22); }
        .info-box { background:#111c30; border-radius:12px; padding:16px 18px; border:1px solid #1a2540; display:flex; align-items:center; gap:12px; }
        .nego-tag { font-size:11px; padding:4px 12px; border-radius:6px; font-weight:500; }
        .cat-grid { display:grid; grid-template-columns:repeat(9,1fr); gap:12px; }
        .cards-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
        .two-col { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
        @media (max-width:1200px) { .cat-grid { grid-template-columns:repeat(5,1fr); } .cards-grid { grid-template-columns:repeat(2,1fr); } }
        @media (max-width:760px) { .cat-grid { grid-template-columns:repeat(3,1fr); } .cards-grid { grid-template-columns:1fr; } .two-col { grid-template-columns:1fr; } }

        /* ── Bouton Modifier (accent indigo, distinct de Publier/Voir) ── */
        .btn-modifier { flex:1; background:linear-gradient(135deg, rgba(129,140,248,0.12), rgba(99,102,241,0.12)); color:#a5b4fc; font-weight:600; font-size:13px; padding:11px 0; border-radius:12px; border:1.5px solid rgba(129,140,248,0.35); cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px; transition:all .2s; }
        .btn-modifier:hover { border-color:rgba(129,140,248,0.75); color:#c7d2fe; background:linear-gradient(135deg, rgba(129,140,248,0.22), rgba(99,102,241,0.22)); transform:translateY(-1px); box-shadow:0 6px 16px rgba(99,102,241,0.22); }

        /* ── Bouton Supprimer (accent rouge/rose, distinct) ── */
        .btn-supprimer { flex:1; background:linear-gradient(135deg, rgba(244,63,94,0.12), rgba(239,68,68,0.12)); color:#fda4af; font-weight:600; font-size:13px; padding:11px 0; border-radius:12px; border:1.5px solid rgba(244,63,94,0.35); cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px; transition:all .2s; }
        .btn-supprimer:hover { border-color:rgba(244,63,94,0.8); color:#fecdd3; background:linear-gradient(135deg, rgba(244,63,94,0.24), rgba(239,68,68,0.24)); transform:translateY(-1px); box-shadow:0 6px 16px rgba(244,63,94,0.28); }
        /* Bouton de confirmation dans la modale (rouge plein) */
        .btn-delete-confirm { padding:11px 26px; border-radius:12px; border:none; background:linear-gradient(135deg,#f43f5e,#dc2626); color:#fff; font-size:13px; font-weight:600; cursor:pointer; transition:all .2s; box-shadow:0 4px 12px rgba(244,63,94,0.3); display:flex; align-items:center; gap:8px; }
        .btn-delete-confirm:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 18px rgba(244,63,94,0.42); }
        .btn-delete-confirm:disabled { opacity:0.6; cursor:not-allowed; }

        /* ── Bandeau statistiques ── */
        .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
        @media (max-width:900px) { .stats-grid { grid-template-columns:repeat(2,1fr); } }
        .stat-card { background:linear-gradient(135deg,#0f1729,#0c1424); border:1.5px solid #1a2540; border-radius:16px; padding:18px 20px; display:flex; align-items:center; gap:14px; transition:all .2s; }
        .stat-card:hover { border-color:rgba(16,185,129,0.35); transform:translateY(-2px); }
        .stat-ico { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
        .stat-val { font-size:20px; font-weight:800; color:#f1f5f9; line-height:1.1; }
        .stat-lbl { font-size:12px; color:#64748b; margin-top:3px; }

        /* ── Barre recherche + tri + export ── */
        .toolbar { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .search-box { position:relative; flex:1; min-width:200px; }
        .search-box input { width:100%; background:#0c1527; border:1.5px solid #1a2540; border-radius:12px; padding:11px 14px 11px 38px; color:#e2e8f0; font-size:13px; outline:none; transition:border-color .2s; }
        .search-box input:focus { border-color:#10b981; }
        .search-box input::placeholder { color:#3b4a63; }
        .search-box .search-ico { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:#475569; font-size:14px; }
        .sort-select { background:#0c1527; border:1.5px solid #1a2540; border-radius:12px; padding:11px 34px 11px 14px; color:#cbd5e1; font-size:13px; cursor:pointer; outline:none; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2364748b' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 12px center; transition:border-color .2s; }
        .sort-select:focus { border-color:#10b981; }
        .sort-select option { background:#0f1729; color:#e2e8f0; }
        .btn-export { display:flex; align-items:center; gap:7px; background:linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.12)); color:#34d399; border:1.5px solid rgba(16,185,129,0.35); border-radius:12px; padding:11px 18px; font-size:13px; font-weight:600; cursor:pointer; transition:all .2s; }
        .btn-export:hover { border-color:rgba(16,185,129,0.75); background:linear-gradient(135deg, rgba(16,185,129,0.22), rgba(5,150,105,0.22)); transform:translateY(-1px); box-shadow:0 6px 16px rgba(16,185,129,0.22); }

        /* ── Bouton Dupliquer (accent ambre) ── */
        .btn-dupliquer { flex:1; background:linear-gradient(135deg, rgba(251,191,36,0.12), rgba(245,158,11,0.12)); color:#fcd34d; font-weight:600; font-size:13px; padding:11px 0; border-radius:12px; border:1.5px solid rgba(251,191,36,0.35); cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px; transition:all .2s; }
        .btn-dupliquer:hover { border-color:rgba(251,191,36,0.8); color:#fde68a; background:linear-gradient(135deg, rgba(251,191,36,0.22), rgba(245,158,11,0.22)); transform:translateY(-1px); box-shadow:0 6px 16px rgba(251,191,36,0.25); }
        .btn-dupliquer:disabled { opacity:0.6; cursor:not-allowed; }
        .matches-link { color:#34d399; display:flex; align-items:center; gap:4px; text-decoration:none; transition:color .2s; }
        .matches-link:hover { color:#6ee7b7; }

        /* ── Modale d'édition (glassmorphism pro) ── */
        .modal-overlay { position:fixed; inset:0; background:rgba(4,8,16,0.72); backdrop-filter:blur(7px); -webkit-backdrop-filter:blur(7px); display:flex; align-items:center; justify-content:center; z-index:1000; padding:24px; }
        .modal-card { width:100%; max-width:640px; max-height:90vh; overflow-y:auto; background:#0f1729; border:1.5px solid #1a2540; border-radius:20px; box-shadow:0 30px 80px rgba(0,0,0,0.6); }
        .modal-header { display:flex; align-items:center; justify-content:space-between; padding:22px 26px; border-bottom:1px solid #1a2540; position:sticky; top:0; background:#0f1729; z-index:2; }
        .modal-close { width:36px; height:36px; border-radius:10px; border:1.5px solid #1a2540; background:#111c30; color:#94a3b8; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:18px; transition:all .2s; }
        .modal-close:hover { border-color:rgba(239,68,68,0.6); color:#f87171; background:rgba(239,68,68,0.08); }
        .modal-body { padding:24px 26px; }
        .modal-footer { display:flex; gap:12px; justify-content:flex-end; padding:18px 26px; border-top:1px solid #1a2540; position:sticky; bottom:0; background:#0f1729; }
        .field-label { font-size:12px; font-weight:600; color:#94a3b8; margin-bottom:7px; display:block; }
        .form-input select, select.form-input { color:#e2e8f0; }
        .form-input option { background:#0f1729; color:#e2e8f0; }
        .btn-cancel { padding:11px 22px; border-radius:12px; border:1.5px solid #1a2540; background:#111c30; color:#cbd5e1; font-size:13px; font-weight:500; cursor:pointer; transition:all .2s; }
        .btn-cancel:hover { border-color:#2a3a5a; color:#e2e8f0; }
        .btn-save { padding:11px 26px; border-radius:12px; border:none; background:#10b981; color:#fff; font-size:13px; font-weight:600; cursor:pointer; transition:all .2s; box-shadow:0 4px 12px rgba(16,185,129,0.25); display:flex; align-items:center; gap:8px; }
        .btn-save:hover:not(:disabled) { background:#059669; transform:translateY(-1px); box-shadow:0 6px 16px rgba(16,185,129,0.35); }
        .btn-save:disabled { opacity:0.6; cursor:not-allowed; }
      `}</style>

      <div className="ma-root">

        {/* ── HEADER ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 32px 20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>📄</span>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9' }}>{t('myl.title')}</h1>
            </div>
            <p style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>{t('myl.subtitle')}</p>
          </div>
          <Link href="/listings/new">
            <button className="btn-publier" style={{ padding: '13px 24px', fontSize: 14, boxShadow: '0 6px 20px rgba(16,185,129,0.2)' }}>
              <span style={{ fontSize: 18, fontWeight: 700 }}>+</span> {t('myl.new')}
            </button>
          </Link>
        </div>

        {/* ── STEP NAVIGATION BAR ────────────────────────────── */}
        <div style={{ padding: '0 32px', marginBottom: 22 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`step-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <div className="num">{tab.num}</div>
                <div className="label">{tab.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FILTER PANELS ──────────────────────────────────── */}
        <div style={{ padding: '0 32px', marginBottom: 22 }}>
          <div className="filter-panel">

            {/* 1. CATEGORY */}
            <div className={`tab-content ${activeTab === 'category' ? 'active' : ''}`}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 6 }}>{t('myl.cat.title')}</h3>
              <p style={{ fontSize: 13, color: '#475569', marginBottom: 22 }}>{t('myl.cat.desc')}</p>
              <div className="cat-grid">
                {categoriesList.map((cat) => {
                  const info = CATEGORY_INFO[cat.id];
                  return (
                    <div
                      key={cat.id}
                      className={`cat-btn ${selectedCategory === cat.id ? 'selected' : ''}`}
                      onClick={() => setSelectedCategory(cat.id)}
                      title={info ? info.label : cat.label}
                    >
                      <div className="cat-thumb">
                        {info?.image && (
                          <img
                            src={info.image}
                            alt={info.alt}
                            loading="lazy"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                        <span className="cat-thumb-emoji">{cat.icon}</span>
                      </div>
                      <div className="cat-label">{cat.label}</div>
                    </div>
                  );
                })}
              </div>

              {/* Panneau détail de la catégorie sélectionnée */}
              {selectedCategory !== 'ALL' && CATEGORY_INFO[selectedCategory] && (() => {
                const info = CATEGORY_INFO[selectedCategory];
                const count = listings.filter((l) => {
                  const c = l.materialCategory;
                  if (selectedCategory === 'CHEMICAL' || selectedCategory === 'CHEMICALS') return c === 'CHEMICAL' || c === 'CHEMICALS';
                  return c === selectedCategory;
                }).length;
                return (
                  <motion.div
                    className="cat-detail"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="cat-detail-img">
                      <img src={info.image} alt={info.alt} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      <span className="cat-detail-emoji">{info.icon}</span>
                    </div>
                    <div className="cat-detail-body">
                      <div className="cat-detail-head">
                        <h4>{info.icon} {info.label}</h4>
                        <span className="cat-detail-count">{count} {count > 1 ? t('myl.listings') : t('myl.listing')}</span>
                      </div>
                      <p className="cat-detail-desc">{info.description}</p>
                      <div className="cat-detail-row"><span className="cat-detail-k">{t('myl.detail.examples')}</span><span className="cat-chips">{info.examples.map((e) => <span key={e} className="cat-chip">{e}</span>)}</span></div>
                      <div className="cat-detail-row"><span className="cat-detail-k">{t('myl.detail.price')}</span><span className="cat-detail-price">💰 {info.priceRange}</span></div>
                      <div className="cat-detail-row"><span className="cat-detail-k">{t('myl.detail.outlets')}</span><span className="cat-chips">{info.industries.map((e) => <span key={e} className="cat-chip green">{e}</span>)}</span></div>
                    </div>
                  </motion.div>
                );
              })()}
            </div>

            {/* 2. LOCATION */}
            <div className={`tab-content ${activeTab === 'location' ? 'active' : ''}`}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 6 }}>{t('myl.loc.title')}</h3>
              <p style={{ fontSize: 13, color: '#475569', marginBottom: 22 }}>{t('myl.loc.desc')}</p>
              <div className="two-col">
                <div>
                  <label style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12, display: 'block' }}>{t('myl.loc.radius')}</label>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {radiusChoices.map((choice) => (
                      <div
                        key={choice.label}
                        className={`radius-btn ${searchRadius === choice.value ? 'active' : ''}`}
                        onClick={() => setSearchRadius(choice.value)}
                      >
                        {choice.label}
                      </div>
                    ))}
                  </div>
                  <div className="info-box" style={{ marginTop: 16, flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#94a3b8' }}>
                      <span>📍</span>
                      <span>{t('myl.loc.yourPos')} : <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{userCity}, Cameroun</span></span>
                    </div>
                    <p style={{ fontSize: 12, color: '#64748b' }}>
                      {filteredListings.length} {filteredListings.length > 1 ? t('myl.listings') : t('myl.listing')} {t('myl.within')} {searchRadius ? `${searchRadius} km` : t('myl.anyDist')}
                    </p>
                  </div>
                </div>
                <div style={{ height: 300, borderRadius: 14, overflow: 'hidden', border: '1.5px solid #1a2540' }}>
                  {activeTab === 'location' && (
                    <RealMap listings={filteredListings} center={userCoords} radiusKm={searchRadius} />
                  )}
                </div>
              </div>
            </div>

            {/* 3. TARIFICATION */}
            <div className={`tab-content ${activeTab === 'tarification' ? 'active' : ''}`}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 6 }}>{t('myl.price.title')}</h3>
              <p style={{ fontSize: 13, color: '#475569', marginBottom: 22 }}>{t('myl.price.desc')}</p>
              <div className="two-col">
                <div>
                  <label style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12, display: 'block' }}>{t('myl.price.range')}</label>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, color: '#64748b', marginBottom: 4, display: 'block' }}>{t('myl.price.min')}</label>
                      <input type="number" step="0.01" className="form-input" value={priceMin}
                        onChange={(e) => setPriceMin(e.target.value === '' ? '' : Number(e.target.value))} />
                    </div>
                    <span style={{ color: '#475569', paddingBottom: 12 }}>→</span>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, color: '#64748b', marginBottom: 4, display: 'block' }}>{t('myl.price.max')}</label>
                      <input type="number" step="0.01" className="form-input" value={priceMax}
                        onChange={(e) => setPriceMax(e.target.value === '' ? '' : Number(e.target.value))} />
                    </div>
                  </div>
                  <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {pricePresets.map((p) => {
                      const isActive = priceMin === p.min && priceMax === p.max;
                      return (
                        <div key={p.label} className={`price-btn ${isActive ? 'active' : ''}`}
                          onClick={() => { setPriceMin(p.min); setPriceMax(p.max); }}>
                          {p.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ background: '#111c30', borderRadius: 12, padding: 20, border: '1px solid #1a2540' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 8 }}>💡 {t('myl.nego.title')}</h4>
                  <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
                    {t('myl.nego.text')}
                  </p>
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <span className="nego-tag" style={{ background: 'rgba(16,185,129,0.10)', color: '#34d399' }}>{t('myl.tag.negotiable')}</span>
                    <span className="nego-tag" style={{ background: 'rgba(59,130,246,0.10)', color: '#60a5fa' }}>{t('myl.tag.fixed')}</span>
                    <span className="nego-tag" style={{ background: 'rgba(245,158,11,0.10)', color: '#fbbf24' }}>{t('myl.tag.quote')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. PUBLICATION */}
            <div className={`tab-content ${activeTab === 'publication' ? 'active' : ''}`}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 6 }}>{t('myl.pub.title')}</h3>
              <p style={{ fontSize: 13, color: '#475569', marginBottom: 22 }}>{t('myl.pub.desc')}</p>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <div className={`status-btn ${statusFilter === 'ALL' ? 'active' : ''}`} onClick={() => setStatusFilter('ALL')}>
                  {t('myl.pub.all')} <span className="count">{listings.length}</span>
                </div>
                <div className={`status-btn ${statusFilter === 'DRAFT' ? 'active' : ''}`} onClick={() => setStatusFilter('DRAFT')}>
                  {t('myl.pub.drafts')} <span className="count">{draftCount}</span>
                </div>
                <div className={`status-btn ${statusFilter === 'PUBLISHED' ? 'active' : ''}`} onClick={() => setStatusFilter('PUBLISHED')}>
                  {t('myl.pub.published')} <span className="count">{pubCount}</span>
                </div>
              </div>
              <div className="info-box">
                <span style={{ color: '#fbbf24', fontSize: 16 }}>⚡</span>
                <p style={{ fontSize: 12, color: '#64748b' }}>
                  {t('myl.pub.info')}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ── BANDEAU STATISTIQUES ───────────────────────────── */}
        <div style={{ padding: '0 32px', marginBottom: 22, position: 'relative' }}>
          {/* Noyau 3D décoratif en fond (droite) — non bloquant, cartes cliquables */}
          <div aria-hidden style={{ position: 'absolute', top: '50%', right: 20, transform: 'translateY(-50%)', width: 300, height: 210, opacity: 0.5, pointerEvents: 'none', zIndex: 0 }}>
            <SymbioNode3D variant="background" />
          </div>
          <div className="stats-grid" style={{ position: 'relative', zIndex: 1 }}>
            <div className="stat-card">
              <div className="stat-ico" style={{ background: 'rgba(16,185,129,0.12)' }}>📋</div>
              <div>
                <div className="stat-val">{listings.length}</div>
                <div className="stat-lbl">{t('myl.stat.listings')} ({pubCount} {t('myl.stat.published')} · {draftCount} {t('myl.stat.drafts')})</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-ico" style={{ background: 'rgba(56,189,248,0.12)' }}>⚖️</div>
              <div>
                <div className="stat-val">{formatVolume(totalVolumeKg)}</div>
                <div className="stat-lbl">{t('myl.stat.volume')}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-ico" style={{ background: 'rgba(251,191,36,0.12)' }}>💰</div>
              <div>
                <div className="stat-val">{formatFcfa(potentialRevenue)}</div>
                <div className="stat-lbl">{t('myl.stat.revenue')}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-ico" style={{ background: 'rgba(167,139,250,0.12)' }}>⚡</div>
              <div>
                <div className="stat-val">{totalMatches}</div>
                <div className="stat-lbl">{t('myl.stat.matches')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── BARRE RECHERCHE + TRI + EXPORT ─────────────────── */}
        <div style={{ padding: '0 32px', marginBottom: 16 }}>
          <div className="toolbar">
            <div className="search-box">
              <span className="search-ico">🔍</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('myl.search')}
              />
            </div>
            <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
              <option value="recent">{t('myl.sort.recent')}</option>
              <option value="price_desc">{t('myl.sort.priceDesc')}</option>
              <option value="price_asc">{t('myl.sort.priceAsc')}</option>
              <option value="volume_desc">{t('myl.sort.volumeDesc')}</option>
              <option value="matches_desc">{t('myl.sort.matchesDesc')}</option>
            </select>
            <button className="btn-export" onClick={exportCSV} title={t('myl.export')}>⬇ {t('myl.export')}</button>
          </div>
        </div>

        {/* ── RESULTS COUNT ──────────────────────────────────── */}
        <div style={{ padding: '0 32px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 13, color: '#475569' }}>
            {filteredListings.length} {filteredListings.length > 1 ? t('myl.listings') : t('myl.listing')} {t('myl.found')}
          </p>
          <button onClick={resetAll} style={{ fontSize: 12, color: '#475569', background: 'none', border: 'none', cursor: 'pointer' }}>
            {t('myl.reset')}
          </button>
        </div>

        {/* ── LISTINGS GRID ──────────────────────────────────── */}
        <div style={{ padding: '0 32px 48px' }}>
          {isLoading ? (
            <div className="cards-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ height: 220, borderRadius: 16, background: '#0f1729', border: '1.5px solid #1a2540', opacity: 0.5 }} />
              ))}
            </div>
          ) : filteredListings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>{t('myl.empty')}</h3>
              <p style={{ fontSize: 13, color: '#475569' }}>{t('myl.emptyDesc')}</p>
            </div>
          ) : (
            <div className="cards-grid">
              {filteredListings.map((listing: any, i: number) => {
                const listingCity = getCityFromCoords(listing.latitude, listing.longitude);
                const dist = getListingDistance(listing);
                const matchesCount = listing._count?.matches || 0;
                const badge = catBadge(listing.materialCategory);
                const isPublished = listing.status === 'PUBLISHED';
                return (
                  <motion.div
                    key={listing.id}
                    className="listing-card"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.4), ease: 'easeOut' }}
                    whileHover={{ y: -4, transition: { duration: 0.18 } }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <span className="badge" style={{ color: badge.color, background: badge.background }}>{t('cat.' + listing.materialCategory).startsWith('cat.') ? listing.materialCategory : t('cat.' + listing.materialCategory)}</span>
                        <span className="badge" style={isPublished
                          ? { color: '#34d399', background: 'rgba(16,185,129,0.15)' }
                          : { color: '#fbbf24', background: 'rgba(251,191,36,0.15)' }}>
                          {listing.status}
                        </span>
                      </div>
                      <h3 className="card-title" style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 14, transition: 'color .2s' }}>
                        {listing.title}
                      </h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: '#34d399' }}>⚖</span> {formatVolume(listing.volumeKg)}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: '#60a5fa' }}>🔄</span> {listing.frequency ? t('freq.' + listing.frequency) : ''}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: '#fbbf24' }}>💰</span> {listing.pricePerKg ? `${listing.pricePerKg} FCFA/kg` : t('myl.toBargain')}</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid #1a2540' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ color: '#ef4444' }}>●</span> {listingCity}, Cameroun
                          {dist > 5 && <span style={{ color: '#334155', marginLeft: 4 }}>({Math.round(dist)} km)</span>}
                        </span>
                        {matchesCount > 0 && (
                          <Link href="/matches" className="matches-link" style={{ fontSize: 12 }}>
                            <span style={{ color: '#fbbf24' }}>⚡</span> {matchesCount} match{matchesCount > 1 ? 'es' : ''} →
                          </Link>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        {listing.status === 'DRAFT' && (
                          <button className="btn-publier" style={{ flex: '1 1 45%' }} onClick={() => handlePublish(listing.id)}>✏️ {t('myl.publish')}</button>
                        )}
                        <button className="btn-modifier" style={{ flex: '1 1 45%' }} onClick={() => openEdit(listing)}>✎ {t('myl.edit')}</button>
                        <Link href={`/marketplace/${listing.id}`} style={{ flex: '1 1 45%' }}>
                          <button className="btn-voir">👁 {t('myl.view')}</button>
                        </Link>
                        <button className="btn-dupliquer" style={{ flex: '1 1 45%' }} disabled={duplicatingId === listing.id} onClick={() => handleDuplicate(listing)}>
                          {duplicatingId === listing.id ? '⏳ ' + t('myl.copying') : '⧉ ' + t('myl.duplicate')}
                        </button>
                        <button className="btn-supprimer" style={{ flex: '1 1 45%' }} onClick={() => askDelete(listing)}>🗑 {t('myl.delete')}</button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── MODALE « MODIFIER » ─────────────────────────────── */}
        <AnimatePresence>
          {editingId && (
            <motion.div
              className="modal-overlay"
              onClick={closeEdit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="modal-card"
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              >
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>✎</span>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9' }}>{t('myl.editTitle')}</h3>
                    <p style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{t('myl.editSub')}</p>
                  </div>
                </div>
                <button className="modal-close" onClick={closeEdit} aria-label="Fermer">✕</button>
              </div>

              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="field-label">{t('myl.f.title')}</label>
                    <input className="form-input" name="title" value={editForm.title} onChange={handleEditChange} placeholder={t('myl.ph.title')} />
                  </div>
                  <div>
                    <label className="field-label">{t('myl.tab.category')}</label>
                    <select className="form-input" name="materialCategory" value={editForm.materialCategory} onChange={handleEditChange}>
                      {EDIT_CATEGORIES.map(([v]) => <option key={v} value={v}>{t('cat.' + v)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">{t('myl.f.type')}</label>
                    <input className="form-input" name="materialType" value={editForm.materialType} onChange={handleEditChange} placeholder={t('myl.ph.type')} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="field-label">{t('myl.f.desc')}</label>
                    <textarea className="form-input" name="description" value={editForm.description} onChange={handleEditChange} rows={3} style={{ resize: 'vertical' }} />
                  </div>
                  <div>
                    <label className="field-label">{t('myl.f.volume')}</label>
                    <input className="form-input" type="number" min={1} name="volumeKg" value={editForm.volumeKg} onChange={handleEditChange} />
                  </div>
                  <div>
                    <label className="field-label">{t('myl.f.frequency')}</label>
                    <select className="form-input" name="frequency" value={editForm.frequency} onChange={handleEditChange}>
                      {EDIT_FREQ.map(([v]) => <option key={v} value={v}>{t('freq.' + v)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">{t('myl.f.price')}</label>
                    <input className="form-input" type="number" step="0.01" min={0} name="pricePerKg" value={editForm.pricePerKg} onChange={handleEditChange} />
                  </div>
                  <div>
                    <label className="field-label">📍 {t('myl.f.location')}</label>
                    <select className="form-input" name="city" value={editForm.city} onChange={handleEditChange}>
                      {CITY_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                {editError && (
                  <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)', color: '#f87171', fontSize: 13 }}>
                    ⚠ {editError}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn-cancel" onClick={closeEdit} disabled={isSaving}>{t('myl.cancel')}</button>
                <button className="btn-save" onClick={handleEditSave} disabled={isSaving}>
                  {isSaving ? '⏳ ' + t('myl.saving') : '💾 ' + t('myl.save')}
                </button>
              </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── MODALE « SUPPRIMER » (confirmation) ─────────────── */}
        <AnimatePresence>
          {deletingId && (
            <motion.div
              className="modal-overlay"
              onClick={() => !isDeleting && setDeletingId(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="modal-card"
                style={{ maxWidth: 440 }}
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              >
                <div className="modal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20 }}>🗑</span>
                    <div>
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9' }}>{t('myl.delTitle')}</h3>
                      <p style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{t('myl.delFinal')}</p>
                    </div>
                  </div>
                  <button className="modal-close" onClick={() => !isDeleting && setDeletingId(null)} aria-label="Fermer">✕</button>
                </div>
                <div className="modal-body">
                  <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.6 }}>
                    {t('myl.delBody1')}{' '}
                    <span style={{ color: '#f1f5f9', fontWeight: 600 }}>« {deletingTitle} »</span>.
                    {' '}{t('myl.delBody2')}{' '}<span style={{ color: '#f87171', fontWeight: 600 }}>{t('myl.irreversible')}</span>{' '}{t('myl.delBody3')}
                  </p>
                  {deleteError && (
                    <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)', color: '#f87171', fontSize: 13 }}>
                      ⚠ {deleteError}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button className="btn-cancel" onClick={() => setDeletingId(null)} disabled={isDeleting}>{t('myl.cancel')}</button>
                  <button className="btn-delete-confirm" onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? '⏳ ' + t('myl.deleting') : '🗑 ' + t('myl.delConfirm')}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
