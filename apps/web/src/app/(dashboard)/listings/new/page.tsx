'use client';

import { useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/LanguageProvider';

// Villes disponibles avec leurs coordonnées (alignées sur la page Mes annonces)
const CITIES: Record<string, { lat: number; lon: number }> = {
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

// Catégories alignées sur l'enum backend (MaterialCategory) pour éviter les erreurs 400
const CATEGORIES: { value: string; label: string }[] = [
  { value: 'BIOMASS', label: '🌱 Biomasse' },
  { value: 'PLASTICS', label: 'Plastiques' },
  { value: 'METALS', label: 'Métaux' },
  { value: 'TEXTILE', label: 'Textile' },
  { value: 'GLASS', label: 'Verre' },
  { value: 'CHEMICALS', label: 'Chimique' },
  { value: 'PAPER', label: 'Papier / Carton' },
  { value: 'CONSTRUCTION', label: 'BTP' },
  { value: 'ELECTRONIC', label: 'DEEE' },
  { value: 'THERMAL', label: 'Thermique' },
];

// Fréquences alignées sur l'enum backend (Frequency)
const FREQUENCIES: { value: string; label: string }[] = [
  { value: 'MONTHLY', label: 'Mensuel' },
  { value: 'WEEKLY', label: 'Hebdomadaire' },
  { value: 'DAILY', label: 'Quotidien' },
  { value: 'ON_DEMAND', label: 'Ponctuel / Lot unique' },
];

// Fourchettes de prix indicatives par catégorie (FCFA/kg) — estimation marché
const PRICE_HINTS: Record<string, [number, number]> = {
  BIOMASS: [30, 100],
  PLASTICS: [130, 400],
  METALS: [330, 1000],
  TEXTILE: [100, 260],
  GLASS: [20, 65],
  CHEMICALS: [200, 650],
  PAPER: [30, 130],
  CONSTRUCTION: [15, 65],
  ELECTRONIC: [525, 2000],
  THERMAL: [15, 55],
};

const DEFAULT_TAGS = [
  'Organique', 'Non-dangereux', 'Biodégradable', 'Compostable',
  'Ininflammable', 'Corrosif', 'Toxique', 'Recyclable',
];

const CERTIFICATIONS: { id: string; title: string; desc: string }[] = [
  { id: 'REACH', title: 'REACH', desc: 'Enregistrement européen' },
  { id: 'ISO14001', title: 'ISO 14001', desc: 'Management environnemental' },
  { id: 'FDS', title: 'FDS disponible', desc: 'Fiche de données de sécurité' },
  { id: 'LABO', title: 'Analyses labo', desc: "Rapports d'analyses joints" },
];

const MAX_PHOTOS = 6;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 Mo

export default function NewListingPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const [title, setTitle] = useState('');
  const [materialCategory, setMaterialCategory] = useState('BIOMASS');
  const [materialType, setMaterialType] = useState('');
  const [description, setDescription] = useState('');
  const [volumeKg, setVolumeKg] = useState('1000');
  const [frequency, setFrequency] = useState('MONTHLY');
  const [pricePerKg, setPricePerKg] = useState('50');
  const [city, setCity] = useState('Douala');
  const [postalCode, setPostalCode] = useState('BP 4011');

  const [tags, setTags] = useState<string[]>(['Organique', 'Non-dangereux', 'Biodégradable']);
  const [allTags, setAllTags] = useState<string[]>(DEFAULT_TAGS);
  const [certifications, setCertifications] = useState<string[]>(['REACH', 'FDS']);
  const [photos, setPhotos] = useState<string[]>([]);

  const coords = CITIES[city] || CITIES['Lyon'];

  const priceHint = (() => {
    const range = PRICE_HINTS[materialCategory];
    if (!range) return null;
    const [low, high] = range;
    const mid = Math.round(((low + high) / 2) * 100) / 100;
    return { low, high, mid };
  })();

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const addTag = () => {
    const name = window.prompt(t('listing.tagPrompt'))?.trim();
    if (!name) return;
    if (!allTags.includes(name)) setAllTags((prev) => [...prev, name]);
    setTags((prev) => (prev.includes(name) ? prev : [...prev, name]));
  };

  const toggleCert = (id: string) => {
    setCertifications((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_PHOTOS - photos.length;
    const list = Array.from(files).slice(0, Math.max(0, remaining));
    for (const file of list) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > MAX_PHOTO_BYTES) {
        setError(`« ${file.name} » ${t('listing.err.photoBig')}`);
        continue;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') setPhotos((prev) => (prev.length >= MAX_PHOTOS ? prev : [...prev, result]));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (idx: number) => setPhotos((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) { setError(t('listing.err.title')); return; }
    if (!materialType.trim()) { setError(t('listing.err.type')); return; }
    if (!description.trim()) { setError(t('listing.err.desc')); return; }

    const volume = Number(volumeKg);
    if (!Number.isFinite(volume) || volume < 1) { setError(t('listing.err.volume')); return; }

    const price = Number(String(pricePerKg).replace(',', '.'));
    if (!Number.isFinite(price) || price < 0) { setError(t('listing.err.price')); return; }

    setIsLoading(true);
    try {
      await api.createListing({
        title: title.trim(),
        materialType: materialType.trim(),
        materialCategory,
        description: description.trim(),
        volumeKg: volume,
        frequency,
        pricePerKg: price,
        latitude: coords.lat,
        longitude: coords.lon,
        chemicalProfile: {
          tags,
          certifications,
          city,
          postalCode: postalCode.trim() || undefined,
        },
        photos,
      });
      router.push('/listings');
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : t('listing.err.generic');
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .na-root { max-width:720px; margin:0 auto; padding:32px 24px; color:#e2e8f0; }
        .na-form-label { display:block; font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#94a3b8; margin-bottom:10px; }
        .na-input { width:100%; background:#0c1527; border:1.5px solid #1a2540; border-radius:12px; padding:14px 18px; color:#e2e8f0; font-size:14px; font-family:inherit; outline:none; transition:border-color .2s; }
        .na-input:focus { border-color:#10b981; }
        .na-input::placeholder { color:#3b4a63; }
        select.na-input { appearance:none; cursor:pointer; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2364748b' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 18px center; padding-right:42px; }
        select.na-input option { background:#0f1729; color:#e2e8f0; }
        textarea.na-input { resize:vertical; min-height:110px; }
        .na-tag { padding:9px 20px; border-radius:22px; font-size:13px; font-weight:500; border:1.5px solid #1a2540; background:transparent; color:#64748b; cursor:pointer; transition:all .2s; font-family:inherit; }
        .na-tag:hover:not(.active) { border-color:#2a3a5a; color:#94a3b8; }
        .na-tag.active { border-color:#10b981; color:#34d399; background:transparent; }
        .na-tag-add { padding:9px 20px; border-radius:22px; font-size:13px; font-weight:500; border:1.5px dashed #10b981; background:transparent; color:#10b981; cursor:pointer; transition:all .2s; font-family:inherit; }
        .na-tag-add:hover { background:rgba(16,185,129,0.05); }
        .na-drop { border:2px dashed #1a2540; border-radius:16px; padding:40px 20px; text-align:center; cursor:pointer; transition:all .3s; }
        .na-drop:hover, .na-drop.drag { border-color:#10b981; background:rgba(16,185,129,0.02); }
        .na-thumb { width:82px; height:82px; border-radius:14px; position:relative; display:inline-flex; align-items:center; justify-content:center; overflow:visible; background:#0c1527; border:1.5px solid #1a2540; }
        .na-thumb img { width:100%; height:100%; object-fit:cover; border-radius:14px; }
        .na-remove { position:absolute; top:-6px; right:-6px; width:22px; height:22px; background:#ef4444; border-radius:50%; border:2.5px solid #0a0f1e; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:12px; color:#fff; font-weight:700; line-height:1; transition:transform .15s; }
        .na-remove:hover { transform:scale(1.15); }
        .na-cert { display:flex; align-items:center; gap:14px; background:#0c1527; border:1.5px solid #1a2540; border-radius:14px; padding:18px 20px; cursor:pointer; transition:border-color .2s; }
        .na-cert:hover { border-color:rgba(16,185,129,0.3); }
        .na-check { width:20px; height:20px; border-radius:5px; border:2px solid #1a2540; background:#0c1527; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .2s; }
        .na-check.checked { background:#10b981; border-color:#10b981; }
        .na-check.checked::after { content:'✓'; color:#fff; font-size:12px; font-weight:700; }
        .na-map { background:#0c1527; border-radius:14px; height:130px; position:relative; overflow:hidden; border:1.5px solid #1a2540; display:flex; align-items:center; justify-content:center; }
        .na-map-grid { position:absolute; inset:0; opacity:0.03; background-image:repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 25px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 25px); }
        @keyframes na-pulse { 0%,100% { box-shadow:0 0 12px rgba(16,185,129,0.6); } 50% { box-shadow:0 0 20px rgba(16,185,129,0.3); } }
        .na-btn-cancel { padding:14px 36px; border-radius:14px; border:1.5px solid #334155; background:transparent; color:#cbd5e1; font-size:14px; font-weight:600; cursor:pointer; transition:all .2s; font-family:inherit; }
        .na-btn-cancel:hover { border-color:#64748b; color:#f1f5f9; }
        .na-btn-create { padding:14px 36px; border-radius:14px; border:none; background:#10b981; color:#fff; font-size:14px; font-weight:600; cursor:pointer; transition:all .2s; box-shadow:0 6px 20px rgba(16,185,129,0.25); font-family:inherit; }
        .na-btn-create:hover:not(:disabled) { background:#059669; transform:translateY(-1px); }
        .na-btn-create:disabled { opacity:0.6; cursor:not-allowed; }
        .na-two { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
        @media (max-width:640px) { .na-two { grid-template-columns:1fr; } }
      `}</style>

      <div className="na-root">
        {/* HEADER */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ color: '#10b981', fontSize: 24, fontWeight: 700 }}>+</span>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>{t('listing.new.title')}</h1>
          </div>
          <p style={{ fontSize: 13, color: '#64748b' }}>{t('listing.new.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* FORM CARD */}
          <div style={{ background: 'rgba(12,21,39,0.5)', border: '1.5px solid #1a2540', borderRadius: 20, padding: '32px 30px' }}>

            {/* TITRE */}
            <div style={{ marginBottom: 24 }}>
              <label className="na-form-label">{t('listing.f.title')}</label>
              <input className="na-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('listing.ph.title')} />
            </div>

            {/* CATÉGORIE + TYPE */}
            <div className="na-two" style={{ marginBottom: 24 }}>
              <div>
                <label className="na-form-label">{t('listing.f.category')}</label>
                <select className="na-input" value={materialCategory} onChange={(e) => setMaterialCategory(e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{t('cat.' + c.value)}</option>)}
                </select>
              </div>
              <div>
                <label className="na-form-label">{t('listing.f.type')}</label>
                <input className="na-input" value={materialType} onChange={(e) => setMaterialType(e.target.value)} placeholder={t('listing.ph.type')} />
              </div>
            </div>

            {/* DESCRIPTION */}
            <div style={{ marginBottom: 24 }}>
              <label className="na-form-label">{t('listing.f.description')}</label>
              <textarea className="na-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('listing.ph.description')} />
            </div>

            {/* VOLUME + FRÉQUENCE */}
            <div className="na-two" style={{ marginBottom: 24 }}>
              <div>
                <label className="na-form-label">{t('listing.f.volume')}</label>
                <input className="na-input" type="number" min={1} value={volumeKg} onChange={(e) => setVolumeKg(e.target.value)} />
              </div>
              <div>
                <label className="na-form-label">{t('listing.f.frequency')}</label>
                <select className="na-input" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                  {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{t('freq.' + f.value)}</option>)}
                </select>
              </div>
            </div>

            {/* PRIX */}
            <div style={{ marginBottom: 32 }}>
              <label className="na-form-label">{t('listing.f.price')}</label>
              <div style={{ maxWidth: '48%' }}>
                <input className="na-input" value={pricePerKg} onChange={(e) => setPricePerKg(e.target.value)} placeholder="50" />
              </div>
              {priceHint && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 12, color: '#94a3b8' }}>
                  <span>💡 {t('listing.priceEst')}&nbsp;: <b style={{ color: '#34d399' }}>{priceHint.low} – {priceHint.high} FCFA/kg</b></span>
                  <button
                    type="button"
                    onClick={() => setPricePerKg(String(priceHint.mid))}
                    style={{ background: 'rgba(16,185,129,0.10)', color: '#34d399', border: '1.5px solid rgba(16,185,129,0.4)', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    {t('listing.apply')} {priceHint.mid} FCFA
                  </button>
                </div>
              )}
            </div>

            {/* PROFIL CHIMIQUE / TAGS */}
            <div style={{ marginBottom: 32 }}>
              <label className="na-form-label" style={{ marginBottom: 14 }}>{t('listing.f.chem')}</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {allTags.map((tag) => (
                  <button type="button" key={tag} className={`na-tag ${tags.includes(tag) ? 'active' : ''}`} onClick={() => toggleTag(tag)}>{t('tag.' + tag).startsWith('tag.') ? tag : t('tag.' + tag)}</button>
                ))}
                <button type="button" className="na-tag-add" onClick={addTag}>{t('listing.addTag')}</button>
              </div>
            </div>

            {/* PHOTOS */}
            <div style={{ marginBottom: 32 }}>
              <label className="na-form-label" style={{ marginBottom: 14 }}>{t('listing.f.photos')}</label>
              <div
                className={`na-drop ${dragActive ? 'drag' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
              >
                <div style={{ marginBottom: 10 }}>
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ margin: '0 auto', display: 'block', opacity: 0.45 }}>
                    <rect x="6" y="8" width="28" height="20" rx="3" stroke="#64748b" strokeWidth="1.8" fill="none" />
                    <path d="M6 22L14 16L20 20.5L26 17L34 22" stroke="#64748b" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="27" cy="14" r="2" fill="#64748b" />
                  </svg>
                </div>
                <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 4 }}>{t('listing.dropHint')}</p>
                <p style={{ fontSize: 12, color: '#475569' }}>{t('listing.dropSub')}</p>
                <input ref={fileInputRef} type="file" style={{ display: 'none' }} multiple accept="image/*" onChange={(e) => handleFiles(e.target.files)} />
              </div>

              {photos.length > 0 && (
                <div style={{ display: 'flex', gap: 14, marginTop: 18, flexWrap: 'wrap' }}>
                  {photos.map((src, i) => (
                    <div className="na-thumb" key={i}>
                      <img src={src} alt={`Photo ${i + 1}`} />
                      <div className="na-remove" onClick={(e) => { e.stopPropagation(); removePhoto(i); }}>×</div>
                    </div>
                  ))}
                </div>
              )}
              <p style={{ fontSize: 12, color: '#475569', marginTop: 10 }}>{photos.length} / {MAX_PHOTOS} {t('listing.photos')}</p>
            </div>

            {/* LOCALISATION */}
            <div style={{ marginBottom: 32 }}>
              <label className="na-form-label" style={{ marginBottom: 14 }}>{t('listing.f.location')}</label>
              <div className="na-two" style={{ marginBottom: 16 }}>
                <select className="na-input" value={city} onChange={(e) => setCity(e.target.value)}>
                  {Object.keys(CITIES).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input className="na-input" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder={t('listing.ph.postal')} />
              </div>
              <div className="na-map">
                <div className="na-map-grid" />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 12, height: 12, background: '#10b981', borderRadius: '50%', animation: 'na-pulse 2s infinite' }} />
                <span style={{ color: '#475569', fontSize: 12, position: 'relative', zIndex: 1 }}>
                  {city}, Cameroun • {coords.lat.toFixed(4)}° N, {coords.lon.toFixed(4)}° E
                </span>
              </div>
            </div>

            {/* CERTIFICATIONS */}
            <div>
              <label className="na-form-label" style={{ marginBottom: 14 }}>{t('listing.f.certs')}</label>
              <div className="na-two" style={{ gap: 14 }}>
                {CERTIFICATIONS.map((cert) => {
                  const checked = certifications.includes(cert.id);
                  return (
                    <div className="na-cert" key={cert.id} onClick={() => toggleCert(cert.id)}>
                      <div className={`na-check ${checked ? 'checked' : ''}`} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{t('cert.' + cert.id + '.title')}</div>
                        <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{t('cert.' + cert.id + '.desc')}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)', color: '#f87171', fontSize: 13 }}>
              ⚠ {error}
            </div>
          )}

          {/* ACTIONS */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 32, paddingBottom: 48 }}>
            <button type="button" className="na-btn-cancel" onClick={() => router.push('/listings')}>{t('listing.cancel')}</button>
            <button type="submit" className="na-btn-create" disabled={isLoading}>
              {isLoading ? '⏳ ' + t('listing.creating') : t('listing.create')}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
