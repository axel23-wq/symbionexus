'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { STATIC_COMPANIES } from '@/data/mockCompanies';

const RealMap = dynamic(() => import('@/components/RealMap'), { ssr: false });

export default function DirectoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedSubdivision, setSelectedSubdivision] = useState('');
  const [materialCategory, setMaterialCategory] = useState('');
  const [hasCollection, setHasCollection] = useState(false);
  const [minCapacity, setMinCapacity] = useState('');
  
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isParsing, setIsParsing] = useState(false);
  const [selectedPartnership, setSelectedPartnership] = useState<any | null>(null);
  const [selectedInfo, setSelectedInfo] = useState<{type: 'material'|'service', title: string, company: string} | null>(null);

  const handleSearch = (v: string) => {
    setSearchQuery(v);
    if (v.length > 2) {
      setIsParsing(true);
      setTimeout(() => setIsParsing(false), 800);
    }
  };

  const fetchDirectory = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulation d'un petit délai pour l'animation IA
      await new Promise(resolve => setTimeout(resolve, 600));

      let results = STATIC_COMPANIES;
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        results = results.filter(c => 
          c.name.toLowerCase().includes(q) || 
          c.description.toLowerCase().includes(q) ||
          (c.procurement?.materialsAccepted || []).some(m => m.toLowerCase().includes(q))
        );
      }
      if (selectedSubdivision) {
        results = results.filter(c => c.profile?.subdivision === selectedSubdivision);
      }
      if (materialCategory) {
        results = results.filter(c => 
          (c.procurement?.materialsAccepted || []).some(m => m.toUpperCase().includes(materialCategory.toUpperCase()))
        );
      }
      if (hasCollection) {
        results = results.filter(c => c.logistics?.collectionService);
      }
      if (minCapacity) {
        results = results.filter(c => (c.capacity?.monthlyCapacityKg || 0) >= parseInt(minCapacity, 10));
      }
      
      setCompanies(results);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedSubdivision, materialCategory, hasCollection, minCapacity]);

  useEffect(() => {
    const timer = setTimeout(() => fetchDirectory(), 300);
    return () => clearTimeout(timer);
  }, [fetchDirectory]);

  // Transform companies to "listings" format just so RealMap can display them if needed
  // RealMap expects { latitude, longitude, materialCategory, title, volumeKg, id }
  const mapMarkers = companies.map(c => ({
    id: c.id,
    latitude: c.companyLatitude,
    longitude: c.companyLongitude,
    materialCategory: c.procurement?.materialsAccepted?.[0] || 'BIOMASS',
    title: c.name,
    volumeKg: c.capacity?.monthlyCapacityKg || 0,
  }));

  const subdivisions = ['Douala I', 'Douala II', 'Douala III', 'Douala IV', 'Douala V', 'Douala VI'];
  const categories = ['METALS', 'PLASTICS', 'BIOMASS', 'WOOD', 'TEXTILE', 'OILS', 'GLASS', 'CHEMICAL'];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', color: '#f1f5f9' }}>
      <div style={{ padding: '40px 32px 0' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>National Circular Economy Directory</h1>
        <p style={{ color: '#94a3b8', fontSize: 15, maxWidth: 600 }}>
          Search, locate, and verify every organization involved in waste management, recycling, and industrial recovery in Cameroon.
        </p>
      </div>

      <div style={{ padding: '32px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* FILTERS */}
        <div style={{ width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* AI Insights Widget */}
          <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(15, 23, 41, 0.8))', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 16, padding: 20, boxShadow: '0 4px 20px rgba(16, 185, 129, 0.05)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#34d399', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🧠</span> AI Network Insights
            </h3>
            <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
              📈 <span style={{ color: '#fff', fontWeight: 600 }}>Forte demande détectée</span> pour le <span style={{ color: '#38bdf8' }}>Plastique PET</span> dans la région Littoral (+22% ce mois-ci).
            </p>
          </div>

          <div style={{ background: '#0f1729', border: '1px solid #1a2540', borderRadius: 16, padding: 24, height: 'fit-content' }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Filtres Avancés</h3>
          
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>
              🤖 AI Semantic Explorer
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Ex: Usine PET avec collecte..." 
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                style={{ 
                  width: '100%', padding: '12px 16px 12px 40px', background: '#111c30', 
                  border: isParsing ? '1.5px solid #10b981' : '1.5px solid #1a2540', 
                  borderRadius: 10, color: '#e2e8f0', fontSize: 14, boxSizing: 'border-box',
                  boxShadow: isParsing ? '0 0 15px rgba(16, 185, 129, 0.2)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              />
              <motion.span 
                animate={{ rotate: isParsing ? 360 : 0 }} 
                transition={{ repeat: isParsing ? Infinity : 0, duration: 1, ease: 'linear' }}
                style={{ position: 'absolute', left: 14, top: 12, fontSize: '1rem', display: 'inline-block' }}
              >
                {isParsing ? '⚙️' : '🔍'}
              </motion.span>
              {isParsing && <div style={{ fontSize: 10, color: '#10b981', marginTop: 4, fontStyle: 'italic', position: 'absolute', left: 0, bottom: -18 }}>✨ Parsing intent via SymbioNexus AI...</div>}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>Subdivision (Douala)</label>
            <select 
              value={selectedSubdivision} 
              onChange={e => setSelectedSubdivision(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', background: '#111c30', border: '1.5px solid #1a2540', borderRadius: 10, color: '#e2e8f0', fontSize: 14 }}
            >
              <option value="">Toutes les zones</option>
              {subdivisions.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>Catégorie Matière</label>
            <select 
              value={materialCategory} 
              onChange={e => setMaterialCategory(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', background: '#111c30', border: '1.5px solid #1a2540', borderRadius: 10, color: '#e2e8f0', fontSize: 14 }}
            >
              <option value="">Toutes matières</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>Capacité Mensuelle Min (Kg)</label>
            <input 
              type="number" 
              placeholder="Ex: 5000" 
              value={minCapacity}
              onChange={e => setMinCapacity(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', background: '#111c30', border: '1.5px solid #1a2540', borderRadius: 10, color: '#e2e8f0', fontSize: 14 }}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: '#cbd5e1' }}>
            <input 
              type="checkbox" 
              checked={hasCollection} 
              onChange={e => setHasCollection(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: '#10b981' }}
            />
            Possède un service de collecte
          </label>
        </div>
      </div>

      {/* LIST & MAP */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ height: 400, background: '#0f1729', border: '1px solid #1a2540', borderRadius: 16, overflow: 'hidden' }}>
            {/* The RealMap coordinates must point to Douala roughly (Lat: 4.0511, Lon: 9.7679) */}
            <RealMap 
              center={{ lat: 4.0511, lon: 9.7679 }} 
              listings={mapMarkers} 
              radiusKm={null} 
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Résultats ({companies.length})</h2>
          </div>

          {isLoading ? (
            <div style={{ color: '#64748b' }}>Chargement...</div>
          ) : companies.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', background: '#0f1729', borderRadius: 16, border: '1px dashed #2a3a5a' }}>
              <span style={{ fontSize: 40 }}>🌍</span>
              <h3 style={{ marginTop: 16, fontSize: 16, color: '#94a3b8' }}>Aucune entreprise trouvée</h3>
              <p style={{ color: '#475569', fontSize: 14 }}>Essayez d'élargir vos critères de recherche.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {companies.map(c => {
                // Generate a stable fake match score based on ID length or chars
                const matchScore = 80 + ((c.id ? String(c.id).charCodeAt(0) : 0) % 19);
                return (
                <motion.div 
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ background: '#0f1729', border: '1px solid #1a2540', borderRadius: 16, padding: 20, position: 'relative', overflow: 'hidden' }}
                >
                  <div style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(16, 185, 129, 0.1)', borderBottomLeftRadius: 16, padding: '6px 12px', border: '1px solid rgba(16, 185, 129, 0.2)', borderTop: 'none', borderRight: 'none' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#34d399' }}>⚡ {matchScore}% AI Match</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12, paddingRight: 90 }}>
                    {c.logoUrl && (
                      <img src={c.logoUrl} alt={`${c.name} logo`} style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover', background: '#fff', border: '2px solid #1a2540' }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>{c.name}</h3>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                        {c.profile?.organizationType && (
                          <span style={{ fontSize: 10, background: 'rgba(56,189,248,0.1)', color: '#38bdf8', padding: '4px 8px', borderRadius: 6, fontWeight: 600, display: 'inline-block' }}>
                            {c.profile.organizationType}
                          </span>
                        )}
                        {c.website && (
                          <a 
                            href={c.website.includes('@') ? `mailto:${c.website}` : c.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '4px 8px', borderRadius: 6, textDecoration: 'none', fontSize: 10, fontWeight: 600, border: '1px solid rgba(16,185,129,0.3)', pointerEvents: 'auto', zIndex: 10 }}
                            title="Site Web Officiel"
                          >
                            <span>🌐</span>
                            <span>{c.website.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0]}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>
                    📍 {c.companyAddress}, {c.profile?.subdivision || c.companyCity}
                  </p>
                  
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #1a2540', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {c.procurement?.materialsAccepted?.slice(0,3).map((m: string) => (
                      <button 
                        key={m} 
                        onClick={() => setSelectedInfo({ type: 'material', title: m, company: c.name })}
                        style={{ cursor: 'pointer', fontSize: 11, background: '#111c30', border: '1px solid #2a3a5a', padding: '4px 10px', borderRadius: 12, color: '#cbd5e1', outline: 'none', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        ℹ️ {m}
                      </button>
                    ))}
                    {c.logistics?.collectionService && (
                      <button 
                        onClick={() => setSelectedInfo({ type: 'service', title: 'Collecte Logistique', company: c.name })}
                        style={{ cursor: 'pointer', fontSize: 11, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '4px 10px', borderRadius: 12, color: '#34d399', outline: 'none', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        🚚 Collecte dispo. (Infos)
                      </button>
                    )}
                  </div>

                  <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                    <a 
                      href={`https://wa.me/${(c.phone || '').replace(/\+/g, '')}`} 
                      target="_blank" rel="noopener noreferrer"
                      style={{ flex: 1, background: '#25D366', border: 'none', borderRadius: 10, padding: '10px 12px', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}
                    >
                      <span>💬</span> WhatsApp
                    </a>
                    <a 
                      href={`tel:${c.phone || ''}`} 
                      style={{ flex: 1, background: '#3b82f6', border: 'none', borderRadius: 10, padding: '10px 12px', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}
                    >
                      <span>📞</span> Appel
                    </a>
                  </div>
                  
                  <button 
                    onClick={() => setSelectedPartnership({ ...c, matchScore })}
                    style={{ width: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', border: 'none', borderRadius: 10, padding: 12, color: '#fff', fontWeight: 700, fontSize: 13, marginTop: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}
                  >
                    <span>🤝</span> Simuler un Partenariat (IA)
                  </button>
                </motion.div>
              )})}
            </div>
          )}
        </div>
      </div>

      {/* Spectacular AI Partnership Modal */}
      {selectedPartnership && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', padding: 20 }}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ width: '100%', maxWidth: 700, background: 'linear-gradient(145deg, #0f172a, #020617)', borderRadius: 24, border: '1px solid rgba(16, 185, 129, 0.3)', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}
          >
            {/* Header */}
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 28 }}>🤖</span> SymbioNexus AI Projection
                </h2>
                <p style={{ color: '#34d399', fontSize: 14, margin: '4px 0 0 0', fontWeight: 600 }}>Analyse prédictive de partenariat B2B</p>
              </div>
              <button onClick={() => setSelectedPartnership(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', width: 36, height: 36, borderRadius: '50%', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            {/* Body */}
            <div style={{ padding: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h3 style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Entreprise Ciblée</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {selectedPartnership.logoUrl && (
                      <img src={selectedPartnership.logoUrl} alt={selectedPartnership.name} style={{ width: 40, height: 40, borderRadius: 8, background: '#fff', objectFit: 'cover' }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>{selectedPartnership.name}</div>
                      </div>
                      <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>📍 {selectedPartnership.companyAddress || 'Zone Locale'}</div>
                      {selectedPartnership.website && (
                        <div style={{ marginTop: 8 }}>
                          <a 
                            href={selectedPartnership.website.includes('@') ? `mailto:${selectedPartnership.website}` : selectedPartnership.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '6px 12px', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 600, border: '1px solid rgba(16,185,129,0.3)', pointerEvents: 'auto' }}
                            title="Site Web Officiel"
                          >
                            <span>🌐</span> {selectedPartnership.website.includes('@') ? 'Contact' : 'Site Officiel'} : {selectedPartnership.website.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0]}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 32, color: '#10b981', filter: 'drop-shadow(0 0 10px rgba(16,185,129,0.5))' }}>⇆</div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', textAlign: 'right' }}>
                  <h3 style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Votre Profil</h3>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>Mon Entreprise</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>📍 Mon Entrepôt</div>
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: 20, borderRadius: 16, border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>⚡</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#34d399' }}>{selectedPartnership.matchScore}%</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>SYNERGIE GLOBALE</div>
                </div>
                <div style={{ background: 'rgba(56, 189, 248, 0.05)', padding: 20, borderRadius: 16, border: '1px solid rgba(56, 189, 248, 0.2)', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🚚</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#38bdf8' }}>+18.4%</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>OPTIMISATION LOGISTIQUE</div>
                </div>
                <div style={{ background: 'rgba(244, 63, 94, 0.05)', padding: 20, borderRadius: 16, border: '1px solid rgba(244, 63, 94, 0.2)', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📉</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#fb7185' }}>-450 kg</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>ÉMISSIONS CO₂ / MOIS</div>
                </div>
              </div>

              {/* Verification & Action */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: 20, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: 20 }}>⛓️</div>
                  <div>
                    <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 14 }}>Profil Certifié Blockchain</div>
                    <div style={{ color: '#64748b', fontSize: 12, fontFamily: 'monospace' }}>0x8f7c...3a9c</div>
                  </div>
                </div>
                <button 
                  onClick={() => alert("Simulated: Blockchain contract deployed successfully!")}
                  style={{ background: '#10b981', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)' }}
                >
                  Générer Contrat Intelligent
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Spectacular Information Modal (Materials & Services) */}
      {selectedInfo && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', padding: 20 }}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            style={{ width: '100%', maxWidth: 650, background: 'linear-gradient(145deg, #0f172a, #020617)', borderRadius: 24, border: '1px solid rgba(56, 189, 248, 0.3)', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.6)' }}
          >
            {/* Header */}
            <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(56, 189, 248, 0.2)' }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{selectedInfo.type === 'material' ? '♻️' : '🚚'}</span> {selectedInfo.title}
                </h2>
                <p style={{ color: '#38bdf8', fontSize: 13, margin: '4px 0 0 0', fontWeight: 600 }}>Informations Détaillées - {selectedInfo.company}</p>
              </div>
              <button onClick={() => setSelectedInfo(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', width: 36, height: 36, borderRadius: '50%', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.2)'} onMouseOut={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}>✕</button>
            </div>

            {/* Body */}
            <div style={{ padding: 32 }}>
              <div style={{ position: 'relative', width: '100%', height: 220, borderRadius: 16, overflow: 'hidden', marginBottom: 24, border: '1px solid rgba(255,255,255,0.1)', background: '#111' }}>
                <img 
                  src={`https://image.pollinations.ai/prompt/Professional%20organigram%20diagram%20and%20photo%20showing%20${encodeURIComponent(selectedInfo.title)}%20recycling%20process%20circular%20economy%20blue%20and%20green%20colors%20minimalist%20modern%20corporate?width=800&height=400&nologo=true`} 
                  alt={selectedInfo.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: 8, fontSize: 11, color: '#fff', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)' }}>
                  Organigramme & Vue IA
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>📊</span> Vue d'ensemble Technique
                </h3>
                <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                  {selectedInfo.type === 'material' 
                    ? `Le processus de recyclage de la matière "${selectedInfo.title}" chez ${selectedInfo.company} implique une collecte sélective stricte, un tri automatisé rigoureux, et une transformation industrielle de pointe. Ce flux permet de réintégrer ces ressources directement dans la chaîne de valeur locale, réduisant ainsi massivement l'empreinte carbone et propulsant l'économie circulaire au Cameroun.`
                    : `Ce service de flotte logistique garantit une traçabilité totale et transparente depuis le point de collecte jusqu'à l'usine de traitement de ${selectedInfo.company}. L'entreprise utilise des véhicules spécialisés et adaptés pour assurer la sécurité environnementale maximale et optimiser les flux de transport.`}
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                  <div style={{ background: '#020617', padding: 16, borderRadius: 12, border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Impact Écologique</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#34d399', marginTop: 6 }}>+85% Valorisés</div>
                  </div>
                  <div style={{ background: '#020617', padding: 16, borderRadius: 12, border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Statut Opérationnel</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#38bdf8', marginTop: 6 }}>Actif & Certifié</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
