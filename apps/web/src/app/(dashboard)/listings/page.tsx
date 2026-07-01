'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
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

// ── Helper: city -> coordinates ──────────────────────────────
const getCoordsForCity = (city: string) => {
  const cityMap: Record<string, { lat: number; lon: number }> = {
    'Lyon': { lat: 45.7578, lon: 4.8320 },
    'Saint-Étienne': { lat: 45.4397, lon: 4.3872 },
    'Marseille': { lat: 43.2965, lon: 5.3698 },
    'Grenoble': { lat: 45.1885, lon: 5.7245 },
    'Toulouse': { lat: 43.6047, lon: 1.4442 },
    'Paris': { lat: 48.8566, lon: 2.3522 },
    'Lille': { lat: 50.6292, lon: 3.0573 },
  };
  return cityMap[city] || { lat: 45.7578, lon: 4.8320 };
};

// ── Helper: nearest city name from coordinates ───────────────
const getCityFromCoords = (lat: number, lon: number): string => {
  const cities = [
    { name: 'Lyon', lat: 45.7578, lon: 4.8320 },
    { name: 'Saint-Étienne', lat: 45.4397, lon: 4.3872 },
    { name: 'Marseille', lat: 43.2965, lon: 5.3698 },
    { name: 'Grenoble', lat: 45.1885, lon: 5.7245 },
    { name: 'Toulouse', lat: 43.6047, lon: 1.4442 },
    { name: 'Paris', lat: 48.8566, lon: 2.3522 },
    { name: 'Lille', lat: 50.6292, lon: 3.0573 },
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
const CITY_NAMES = ['Lyon', 'Saint-Étienne', 'Marseille', 'Grenoble', 'Toulouse', 'Paris', 'Lille'];
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
  volumeKg: 0 as number | string, frequency: 'MONTHLY', pricePerKg: 0 as number | string, city: 'Lyon',
};

export default function MyListingsPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'category' | 'location' | 'tarification' | 'publication'>('category');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchRadius, setSearchRadius] = useState<number | null>(200);
  const [priceMin, setPriceMin] = useState<number | string>(0);
  const [priceMax, setPriceMax] = useState<number | string>(1);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED'>('ALL');

  useEffect(() => { loadListings(); }, []);

  const loadListings = async () => {
    try {
      const result = await api.getMyListings();
      setListings(result.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await api.publishListing(id);
      loadListings();
    } catch (err) {
      console.error(err);
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
      setEditError(err?.message || 'Erreur lors de la sauvegarde');
      setIsSaving(false);
    }
  };

  const userCity = user?.company?.companyCity || 'Lyon';
  const userCoords = useMemo(() => getCoordsForCity(userCity), [userCity]);
  const getListingDistance = (l: any) => haversineDistance(userCoords.lat, userCoords.lon, l.latitude, l.longitude);

  const formatVolume = (kg: number) => (kg >= 1000 ? `${kg / 1000}t` : `${kg} kg`);

  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
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
      return true;
    });
  }, [listings, selectedCategory, searchRadius, priceMin, priceMax, statusFilter, userCoords]);

  const tabs = [
    { id: 'category', num: 1, label: 'Categorie' },
    { id: 'location', num: 2, label: 'Localisation' },
    { id: 'tarification', num: 3, label: 'Tarification' },
    { id: 'publication', num: 4, label: 'Publication' },
  ] as const;

  const categoriesList = [
    { id: 'ALL', label: 'Toutes', icon: '📋' },
    { id: 'METALS', label: 'Metaux', icon: '⚙️' },
    { id: 'PLASTICS', label: 'Plastiques', icon: '🧪' },
    { id: 'BIOMASS', label: 'Biomasse', icon: '🌱' },
    { id: 'WOOD', label: 'Bois', icon: '🌲' },
    { id: 'TEXTILE', label: 'Textile', icon: '🧵' },
    { id: 'OILS', label: 'Huiles', icon: '💧' },
    { id: 'GLASS', label: 'Verre', icon: '🔮' },
    { id: 'CHEMICAL', label: 'Chimique', icon: '⚗️' },
  ];

  const radiusChoices: { value: number | null; label: string }[] = [
    { value: 50, label: '50 km' },
    { value: 100, label: '100 km' },
    { value: 200, label: '200 km' },
    { value: 500, label: '500 km' },
    { value: null, label: 'Tout' },
  ];

  const pricePresets = [
    { min: 0, max: 0.1, label: '< 0.10 €' },
    { min: 0.1, max: 0.3, label: '0.10 - 0.30 €' },
    { min: 0.3, max: 1, label: '0.30 - 1.00 €' },
    { min: '', max: '', label: 'Tous les prix' },
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
        .cat-btn { display:flex; flex-direction:column; align-items:center; gap:10px; padding:18px 12px; border-radius:14px; border:1.5px solid #1a2540; background:#111c30; cursor:pointer; transition:all .2s; min-width:0; }
        .cat-btn:hover:not(.selected) { border-color:#2a3a5a; background:#152035; }
        .cat-btn .cat-icon { font-size:26px; line-height:1; transition:transform .2s; }
        .cat-btn:hover .cat-icon { transform:scale(1.15); }
        .cat-btn .cat-label { font-size:12px; font-weight:500; color:#94a3b8; transition:color .2s; }
        .cat-btn.selected { border-color:rgba(16,185,129,0.5); background:rgba(16,185,129,0.06); }
        .cat-btn.selected .cat-label { color:#34d399; }
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
        .btn-voir { width:100%; background:#111c30; color:#cbd5e1; font-weight:500; font-size:13px; padding:11px 0; border-radius:12px; border:1.5px solid #1a2540; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:all .2s; }
        .btn-voir:hover { border-color:rgba(16,185,129,0.4); color:#34d399; }
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
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9' }}>Mes annonces</h1>
            </div>
            <p style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>Gerez vos offres de matieres secondaires</p>
          </div>
          <Link href="/listings/new">
            <button className="btn-publier" style={{ padding: '13px 24px', fontSize: 14, boxShadow: '0 6px 20px rgba(16,185,129,0.2)' }}>
              <span style={{ fontSize: 18, fontWeight: 700 }}>+</span> Nouvelle annonce
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
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 6 }}>Categorie de matiere</h3>
              <p style={{ fontSize: 13, color: '#475569', marginBottom: 22 }}>Filtrez vos annonces par type de matiere ou selectionnez une categorie pour voir les industries compatibles</p>
              <div className="cat-grid">
                {categoriesList.map((cat) => (
                  <div
                    key={cat.id}
                    className={`cat-btn ${selectedCategory === cat.id ? 'selected' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <div className="cat-icon">{cat.icon}</div>
                    <div className="cat-label">{cat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. LOCATION */}
            <div className={`tab-content ${activeTab === 'location' ? 'active' : ''}`}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 6 }}>Localisation &amp; Proximite</h3>
              <p style={{ fontSize: 13, color: '#475569', marginBottom: 22 }}>Trouvez les industries les plus proches interessees par votre type de matiere</p>
              <div className="two-col">
                <div>
                  <label style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12, display: 'block' }}>Rayon de recherche</label>
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
                      <span>Votre position : <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{userCity}, France</span></span>
                    </div>
                    <p style={{ fontSize: 12, color: '#64748b' }}>
                      {filteredListings.length} annonce{filteredListings.length > 1 ? 's' : ''} dans un rayon de {searchRadius ? `${searchRadius} km` : 'toutes distances'}
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
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 6 }}>Tarification &amp; Negociation</h3>
              <p style={{ fontSize: 13, color: '#475569', marginBottom: 22 }}>Filtrez par fourchette de prix et discutez directement avec les industries interessees</p>
              <div className="two-col">
                <div>
                  <label style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12, display: 'block' }}>Fourchette de prix (€/kg)</label>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, color: '#64748b', marginBottom: 4, display: 'block' }}>Min</label>
                      <input type="number" step="0.01" className="form-input" value={priceMin}
                        onChange={(e) => setPriceMin(e.target.value === '' ? '' : Number(e.target.value))} />
                    </div>
                    <span style={{ color: '#475569', paddingBottom: 12 }}>→</span>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, color: '#64748b', marginBottom: 4, display: 'block' }}>Max</label>
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
                  <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 8 }}>💡 Negociation</h4>
                  <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
                    Les prix affiches sont indicatifs. Apres publication, les industries interessees peuvent vous contacter via la <span style={{ color: '#34d399' }}>messagerie securisee</span> pour negocier le tarif, le volume et les conditions de transport.
                  </p>
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <span className="nego-tag" style={{ background: 'rgba(16,185,129,0.10)', color: '#34d399' }}>Negociable</span>
                    <span className="nego-tag" style={{ background: 'rgba(59,130,246,0.10)', color: '#60a5fa' }}>Prix fixe</span>
                    <span className="nego-tag" style={{ background: 'rgba(245,158,11,0.10)', color: '#fbbf24' }}>Sur devis</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. PUBLICATION */}
            <div className={`tab-content ${activeTab === 'publication' ? 'active' : ''}`}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 6 }}>Statut de publication</h3>
              <p style={{ fontSize: 13, color: '#475569', marginBottom: 22 }}>Gerez la visibilite de vos annonces — publiez vos brouillons ou archivez les offres expirees</p>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <div className={`status-btn ${statusFilter === 'ALL' ? 'active' : ''}`} onClick={() => setStatusFilter('ALL')}>
                  Toutes <span className="count">{listings.length}</span>
                </div>
                <div className={`status-btn ${statusFilter === 'DRAFT' ? 'active' : ''}`} onClick={() => setStatusFilter('DRAFT')}>
                  Brouillons <span className="count">{draftCount}</span>
                </div>
                <div className={`status-btn ${statusFilter === 'PUBLISHED' ? 'active' : ''}`} onClick={() => setStatusFilter('PUBLISHED')}>
                  Publiees <span className="count">{pubCount}</span>
                </div>
              </div>
              <div className="info-box">
                <span style={{ color: '#fbbf24', fontSize: 16 }}>⚡</span>
                <p style={{ fontSize: 12, color: '#64748b' }}>
                  Les annonces en <span style={{ color: '#fbbf24', fontWeight: 500 }}>DRAFT</span> ne sont pas visibles sur la marketplace. Publiez-les pour activer le matchmaking IA et recevoir des propositions.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ── RESULTS COUNT ──────────────────────────────────── */}
        <div style={{ padding: '0 32px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 13, color: '#475569' }}>
            {filteredListings.length} annonce{filteredListings.length > 1 ? 's' : ''} trouvee{filteredListings.length > 1 ? 's' : ''}
          </p>
          <button onClick={resetAll} style={{ fontSize: 12, color: '#475569', background: 'none', border: 'none', cursor: 'pointer' }}>
            Reinitialiser les filtres
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
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Aucune annonce trouvee</h3>
              <p style={{ fontSize: 13, color: '#475569' }}>Essayez de modifier vos filtres ou creez une nouvelle annonce.</p>
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
                        <span className="badge" style={{ color: badge.color, background: badge.background }}>{listing.materialCategory}</span>
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
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: '#60a5fa' }}>🔄</span> {listing.frequency}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: '#fbbf24' }}>💰</span> {listing.pricePerKg ? `${listing.pricePerKg}€/kg` : 'À débattre'}</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid #1a2540' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ color: '#ef4444' }}>●</span> {listingCity}, France
                          {dist > 5 && <span style={{ color: '#334155', marginLeft: 4 }}>({Math.round(dist)} km)</span>}
                        </span>
                        {matchesCount > 0 && (
                          <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ color: '#fbbf24' }}>⚡</span> {matchesCount} match{matchesCount > 1 ? 'es' : ''}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        {listing.status === 'DRAFT' && (
                          <button className="btn-publier" onClick={() => handlePublish(listing.id)}>✏️ Publier</button>
                        )}
                        <button className="btn-modifier" onClick={() => openEdit(listing)}>✎ Modifier</button>
                        <Link href={`/marketplace/${listing.id}`} style={{ flex: 1 }}>
                          <button className="btn-voir">👁 Voir</button>
                        </Link>
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
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9' }}>Modifier l&apos;annonce</h3>
                    <p style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Mettez a jour les details de votre offre</p>
                  </div>
                </div>
                <button className="modal-close" onClick={closeEdit} aria-label="Fermer">✕</button>
              </div>

              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="field-label">Titre de l&apos;annonce</label>
                    <input className="form-input" name="title" value={editForm.title} onChange={handleEditChange} placeholder="Ex: Marc de cafe — 5t/semaine" />
                  </div>
                  <div>
                    <label className="field-label">Categorie</label>
                    <select className="form-input" name="materialCategory" value={editForm.materialCategory} onChange={handleEditChange}>
                      {EDIT_CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Type precis</label>
                    <input className="form-input" name="materialType" value={editForm.materialType} onChange={handleEditChange} placeholder="Ex: Marc de cafe usage" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="field-label">Description</label>
                    <textarea className="form-input" name="description" value={editForm.description} onChange={handleEditChange} rows={3} style={{ resize: 'vertical' }} />
                  </div>
                  <div>
                    <label className="field-label">Volume (kg)</label>
                    <input className="form-input" type="number" min={1} name="volumeKg" value={editForm.volumeKg} onChange={handleEditChange} />
                  </div>
                  <div>
                    <label className="field-label">Frequence</label>
                    <select className="form-input" name="frequency" value={editForm.frequency} onChange={handleEditChange}>
                      {EDIT_FREQ.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Prix (€ / kg)</label>
                    <input className="form-input" type="number" step="0.01" min={0} name="pricePerKg" value={editForm.pricePerKg} onChange={handleEditChange} />
                  </div>
                  <div>
                    <label className="field-label">📍 Localisation</label>
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
                <button className="btn-cancel" onClick={closeEdit} disabled={isSaving}>Annuler</button>
                <button className="btn-save" onClick={handleEditSave} disabled={isSaving}>
                  {isSaving ? '⏳ Enregistrement…' : '💾 Enregistrer'}
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
