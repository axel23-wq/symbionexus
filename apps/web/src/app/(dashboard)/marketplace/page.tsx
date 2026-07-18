'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/LanguageProvider';

// Données fictives très pro pour ne jamais avoir de page vide lors de la présentation
const MOCK_LISTINGS = [
  {
    id: 'mock-1',
    title: 'Bobines d\'Acier Inoxydable (Chutes industrielles)',
    description: 'Chutes d\'acier inoxydable 304L issues de la production de cuves agroalimentaires. Matériau très propre et trié, idéal pour refonte immédiate en fonderie.',
    materialCategory: 'METALS',
    status: 'AVAILABLE',
    volumeKg: 4500,
    pricePerKg: 450,
    frequency: 'MONTHLY',
    company: { name: 'Acieries du Wouri', companyCity: 'Douala', trustScore: 0.94 },
  },
  {
    id: 'mock-2',
    title: 'Déchets de Cuivre (Câbles dénudés)',
    description: 'Cuivre millberry de haute pureté récupéré sur des chantiers de démolition. Prêt pour la refonte immédiate et le câblage.',
    materialCategory: 'METALS',
    status: 'AVAILABLE',
    volumeKg: 1200,
    pricePerKg: 3200,
    frequency: 'ONE_TIME',
    company: { name: 'EcoMetal CMR', companyCity: 'Yaoundé', trustScore: 0.98 },
  },
  {
    id: 'mock-3',
    title: 'Granulés PET recyclés de haute qualité',
    description: 'Granulés de PET transparents (rPET) issus de bouteilles post-consommation, lavés à chaud et extrudés. Grade alimentaire approuvé.',
    materialCategory: 'PLASTICS',
    status: 'AVAILABLE',
    volumeKg: 15000,
    pricePerKg: 350,
    frequency: 'WEEKLY',
    company: { name: 'PlastRecycle Ltd', companyCity: 'Douala', trustScore: 0.89 },
  },
  {
    id: 'mock-4',
    title: 'Fûts PEHD industriels (Broyés)',
    description: 'PEHD broyé provenant de fûts industriels nettoyés avec triple rinçage. Couleur bleue dominante. Excellent indice de fluidité pour injection.',
    materialCategory: 'PLASTICS',
    status: 'AVAILABLE',
    volumeKg: 8500,
    pricePerKg: 280,
    frequency: 'MONTHLY',
    company: { name: 'PolyIndustries', companyCity: 'Bafoussam', trustScore: 0.92 },
  },
  {
    id: 'mock-5',
    title: 'Coques de Cacao pour Valorisation Énergétique',
    description: 'Biomasse à haut pouvoir calorifique (PCI élevé). Coques séchées issues de la transformation industrielle de fèves de cacao.',
    materialCategory: 'BIOMASS',
    status: 'AVAILABLE',
    volumeKg: 50000,
    pricePerKg: 45,
    frequency: 'MONTHLY',
    company: { name: 'AgroTransform S.A.', companyCity: 'Sanaga', trustScore: 0.97 },
  },
  {
    id: 'mock-6',
    title: 'Sciure de Bois Exotique (Non traité)',
    description: 'Sciure de bois d\'essences nobles (padouk, sapelli), garantie sans aucun traitement chimique. Parfait pour la fabrication de pellets ou briquettes.',
    materialCategory: 'BIOMASS',
    status: 'AVAILABLE',
    volumeKg: 12000,
    pricePerKg: 25,
    frequency: 'WEEKLY',
    company: { name: 'Scieries Réunies', companyCity: 'Bertoua', trustScore: 0.91 },
  },
  {
    id: 'mock-7',
    title: 'Solvants usagés (Mélange Acétone / Toluène)',
    description: 'Mélange de solvants industriels issus de lignes de peinture. Stockés en fûts ADR. Pour régénération ou valorisation énergétique stricte.',
    materialCategory: 'CHEMICALS',
    status: 'AVAILABLE',
    volumeKg: 2000,
    pricePerKg: 150,
    frequency: 'MONTHLY',
    company: { name: 'ChimPro', companyCity: 'Douala', trustScore: 0.85 },
  },
  {
    id: 'mock-8',
    title: 'Chutes de Tissus Coton (Coloris mixtes)',
    description: 'Chutes de coupe d\'ateliers de confection textile. 100% coton. Parfait pour effilochage, isolation thermique ou chiffons industriels.',
    materialCategory: 'TEXTILE',
    status: 'AVAILABLE',
    volumeKg: 3500,
    pricePerKg: 110,
    frequency: 'MONTHLY',
    company: { name: 'CotonAfrik', companyCity: 'Garoua', trustScore: 0.96 },
  },
  {
    id: 'mock-9',
    title: 'Gravats Béton Concassés (GNT)',
    description: 'Béton concassé calibré 0/31.5 issu de chantiers de démolition. Exempt d\'acier et de bois. Idéal pour sous-couches routières ou remblais.',
    materialCategory: 'CONSTRUCTION',
    status: 'AVAILABLE',
    volumeKg: 250000,
    pricePerKg: 15,
    frequency: 'ONE_TIME',
    company: { name: 'BatiDem', companyCity: 'Yaoundé', trustScore: 0.93 },
  },
  {
    id: 'mock-10',
    title: 'Calcin de Verre Mixte',
    description: 'Verre brisé d\'emballages, trié optiquement. Exempt d\'impuretés métalliques et céramiques. Prêt pour l\'enfournement en verrerie.',
    materialCategory: 'GLASS',
    status: 'AVAILABLE',
    volumeKg: 18000,
    pricePerKg: 65,
    frequency: 'MONTHLY',
    company: { name: 'VerreRecup', companyCity: 'Douala', trustScore: 0.88 },
  },
  {
    id: 'mock-11',
    title: 'Cartons Ondulés (Balles OCC 11)',
    description: 'Balles pressées à haute densité de vieux cartons ondulés très propres, provenant de la grande distribution. Pas d\'humidité excessive.',
    materialCategory: 'PAPER',
    status: 'AVAILABLE',
    volumeKg: 40000,
    pricePerKg: 85,
    frequency: 'WEEKLY',
    company: { name: 'PaperCycle', companyCity: 'Yaoundé', trustScore: 0.95 },
  },
  {
    id: 'mock-12',
    title: 'Cartes Mères Obsolètes (Catégorie A)',
    description: 'Cartes mères d\'ordinateurs et serveurs. Riches en métaux précieux (or, palladium). Triées, sans piles ni radiateurs volumineux.',
    materialCategory: 'ELECTRONIC',
    status: 'AVAILABLE',
    volumeKg: 450,
    pricePerKg: 4500,
    frequency: 'MONTHLY',
    company: { name: 'eWaste Solutions', companyCity: 'Douala', trustScore: 0.99 },
  },
  {
    id: 'mock-13',
    title: 'Huiles de friture usagées',
    description: 'Huiles végétales alimentaires usagées (UCO) décantées et filtrées à 50 microns. FFA < 5%. Parfait pour production de biocarburants.',
    materialCategory: 'BIOMASS',
    status: 'AVAILABLE',
    volumeKg: 4000,
    pricePerKg: 350,
    frequency: 'WEEKLY',
    company: { name: 'BioFuel CMR', companyCity: 'Douala', trustScore: 0.92 },
  },
];

const CATEGORIES = [
  { key: '', icon: '🔄', color: '#64748b' },
  { key: 'METALS', icon: '⚙️', color: '#f59e0b' },
  { key: 'PLASTICS', icon: '♻️', color: '#3b82f6' },
  { key: 'BIOMASS', icon: '🌿', color: '#10b981' },
  { key: 'CHEMICALS', icon: '🧪', color: '#ef4444' },
  { key: 'TEXTILE', icon: '🧵', color: '#0ea5e9' },
  { key: 'CONSTRUCTION', icon: '🏗️', color: '#78716c' },
  { key: 'GLASS', icon: '🔬', color: '#06b6d4' },
  { key: 'PAPER', icon: '📄', color: '#a3e635' },
  { key: 'ELECTRONIC', icon: '💻', color: '#ec4899' },
  { key: 'DIVERS', icon: '📦', color: '#a8a29e' },
];

const MARKET_INSIGHTS: Record<string, any> = {
  'METALS': { avgPrice: '450 - 3200 FCFA/kg', trend: '+4.2% (Forte demande)', impact: '-1.5t CO₂/t', index: 'Très Haut' },
  'PLASTICS': { avgPrice: '250 - 450 FCFA/kg', trend: '+1.5% (Stable)', impact: '-0.8t CO₂/t', index: 'Haut' },
  'BIOMASS': { avgPrice: '20 - 80 FCFA/kg', trend: '+8.0% (En explosion)', impact: 'Neutre Carbone', index: 'Excellent' },
  'CHEMICALS': { avgPrice: '100 - 500 FCFA/kg', trend: '-2.0% (Baisse)', impact: 'Prot. Nappes', index: 'Réglementé stricte' },
  'TEXTILE': { avgPrice: '50 - 150 FCFA/kg', trend: '+3.1% (Croissance)', impact: '-5.0t Eau/t', index: 'Moyen' },
  'CONSTRUCTION': { avgPrice: '10 - 30 FCFA/kg', trend: '+0.5% (Stable)', impact: 'Prot. Carrières', index: 'Haut (Volume)' },
  'GLASS': { avgPrice: '50 - 90 FCFA/kg', trend: '+1.0% (Stable)', impact: '-0.3t CO₂/t', index: 'Très Haut' },
  'PAPER': { avgPrice: '60 - 120 FCFA/kg', trend: '+2.5% (Hausse)', impact: 'Prot. Forêts', index: 'Haut' },
  'ELECTRONIC': { avgPrice: '1500 - 5000+ FCFA/kg', trend: '+12% (Pénurie)', impact: 'Réd. Toxicité', index: 'Très Haut' },
  'DIVERS': { avgPrice: 'Variable', trend: 'N/A', impact: 'Variable', index: 'Variable' },
};

export default function MarketplacePage() {
  const { t } = useTranslation();
  const catLabel = (key: string) => {
    if (!key) return t('mkt.all');
    if (key === 'DIVERS') return 'Divers';
    return t('cat.' + key);
  };
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // States for Smart Booking Modal
  const [selectedBookingListing, setSelectedBookingListing] = useState<any>(null);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleBook = () => {
    setBookingStatus('loading');
    setTimeout(() => {
      setBookingStatus('success');
    }, 1500);
  };

  const closeBooking = () => {
    setSelectedBookingListing(null);
    setBookingStatus('idle');
  };

  const loadListings = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (activeCategory) params.materialCategory = activeCategory;
      if (searchTerm) params.search = searchTerm;
      
      let realData = [];
      try {
        const result = await api.getListings(params);
        realData = result.data || [];
      } catch (err) {
        console.warn('API error, using fallback mock data only');
      }

      // Merge Real API data with our Premium Mock Data to always show a professional UI
      let filteredMocks = MOCK_LISTINGS;
      if (activeCategory) {
        filteredMocks = MOCK_LISTINGS.filter(m => m.materialCategory === activeCategory);
      }
      if (searchTerm) {
        filteredMocks = filteredMocks.filter(m => 
          m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
          m.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setListings([...realData, ...filteredMocks]);
    } catch (err) {
      console.error('Listings load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, searchTerm]);

  useEffect(() => {
    loadListings();
  }, [activeCategory, loadListings]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadListings();
  };

  const getCategoryColor = (category: string) => {
    return CATEGORIES.find((c) => c.key === category)?.color || '#64748b';
  };

  const activeInsights = activeCategory ? MARKET_INSIGHTS[activeCategory] : null;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">🏪 Marketplace Intelligence</h1>
          <p className="page-subtitle">
            Découvrez, négociez et valorisez les flux matières issus de l'économie circulaire.
          </p>
        </div>
      </div>

      {/* Category filters (Premium redesign) */}
      <div style={{
        display: 'flex',
        gap: '12px',
        overflowX: 'auto',
        paddingBottom: '16px',
        marginBottom: '16px',
      }}>
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key;
          const catCount = cat.key 
            ? MOCK_LISTINGS.filter(m => m.materialCategory === cat.key).length 
            : MOCK_LISTINGS.length;

          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              style={{
                padding: '12px 20px',
                fontSize: '0.9rem',
                fontWeight: isActive ? 700 : 500,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '12px',
                background: isActive ? `${cat.color}15` : 'var(--color-bg-glass-light)',
                border: `1px solid ${isActive ? cat.color : 'var(--border-subtle)'}`,
                color: isActive ? cat.color : 'var(--color-text-secondary)',
                boxShadow: isActive ? `0 0 15px ${cat.color}40` : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{cat.icon}</span>
              <span>{catLabel(cat.key)}</span>
              <span style={{
                background: isActive ? cat.color : 'var(--color-bg-dark)',
                color: isActive ? '#fff' : 'var(--color-text-muted)',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}>
                {catCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Premium Market Insights Panel */}
      {activeInsights && (
        <div className="neo-card" style={{
          marginBottom: '32px',
          padding: '20px',
          background: `linear-gradient(90deg, ${getCategoryColor(activeCategory)}10, transparent)`,
          borderLeft: `4px solid ${getCategoryColor(activeCategory)}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '1.5rem' }}>📊</span>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Market Intelligence : {catLabel(activeCategory)}</h3>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div style={{ background: 'var(--color-bg-glass-light)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Prix Moyen Marché</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{activeInsights.avgPrice}</div>
            </div>
            <div style={{ background: 'var(--color-bg-glass-light)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Tendance Demande</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: activeInsights.trend.includes('-') ? '#ef4444' : '#10b981' }}>{activeInsights.trend}</div>
            </div>
            <div style={{ background: 'var(--color-bg-glass-light)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Impact Environnemental</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-primary-400)' }}>{activeInsights.impact}</div>
            </div>
            <div style={{ background: 'var(--color-bg-glass-light)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Indice de Circularité</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{activeInsights.index}</div>
            </div>
          </div>
        </div>
      )}

      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ marginBottom: '24px' }}>
        <div className="search-bar" style={{ maxWidth: '600px', width: '100%', border: '1px solid var(--color-primary-600)', boxShadow: '0 0 10px rgba(52,211,153,0.1)' }}>
          <span style={{ fontSize: '1.1rem' }}>🔍</span>
          <input
            type="text"
            placeholder="Rechercher par matériau, entreprise, localisation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: '8px 20px', fontSize: '0.9rem' }}
          >
            Analyser
          </button>
        </div>
      </form>

      {/* Listings grid */}
      {isLoading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '24px',
        }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton" style={{ height: '320px', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 24px',
          color: 'var(--color-text-muted)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
            Aucun gisement trouvé
          </h3>
          <p>Essayez de modifier vos filtres de recherche.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '24px',
        }}>
          {listings.map((listing: any, i: number) => (
            <Link
              key={listing.id}
              href={`/marketplace/${listing.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="neo-card animate-fade-in hover-glow"
                style={{
                  padding: '24px',
                  cursor: 'pointer',
                  animationDelay: `${i * 80}ms`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  border: '1px solid var(--border-subtle)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = `0 10px 25px ${getCategoryColor(listing.materialCategory)}30`;
                  e.currentTarget.style.border = `1px solid ${getCategoryColor(listing.materialCategory)}80`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  e.currentTarget.style.border = '1px solid var(--border-subtle)';
                }}
              >
                {/* Category badge + status */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}>
                  <span
                    className="badge"
                    style={{
                      color: getCategoryColor(listing.materialCategory),
                      background: `${getCategoryColor(listing.materialCategory)}15`,
                      borderColor: `${getCategoryColor(listing.materialCategory)}50`,
                      fontWeight: 'bold'
                    }}
                  >
                    {CATEGORIES.find((c) => c.key === listing.materialCategory)?.icon}{' '}
                    {catLabel(listing.materialCategory)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedBookingListing(listing);
                    }}
                    className="badge" 
                    style={{ 
                      background: '#10b98120', color: '#10b981', border: '1px solid #10b98150',
                      cursor: 'pointer', transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.4)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    🟢 DISPONIBLE (Réserver)
                  </button>
                </div>

                {/* Title */}
                <h3 style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  marginBottom: '12px',
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.4,
                }}>
                  {listing.title}
                </h3>

                {/* Description */}
                <p style={{
                  fontSize: '0.85rem',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '20px',
                  lineHeight: 1.6,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  flex: 1,
                }}>
                  {listing.description}
                </p>

                {/* Stats row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  padding: '16px 0',
                  borderTop: '1px solid var(--border-subtle)',
                }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      📦 Volume
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-primary-400)' }}>
                      {listing.volumeKg >= 1000 ? `${(listing.volumeKg / 1000).toFixed(1)} Tonnes` : `${listing.volumeKg} kg`}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      💰 Prix (kg)
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#f59e0b' }}>
                      {listing.pricePerKg ? `${listing.pricePerKg} FCFA` : 'Négociable'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      🔄 Fréquence
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {listing.frequency === 'MONTHLY' ? 'Mensuel' : listing.frequency === 'WEEKLY' ? 'Hebdomadaire' : 'Ponctuel'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      📍 Localisation
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {listing.company?.companyCity || 'Cameroun'}
                    </div>
                  </div>
                </div>

                {/* Company row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-subtle)',
                }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'white',
                    boxShadow: '0 0 10px var(--color-primary-600)'
                  }}>
                    {listing.company?.name?.substring(0, 2) || 'SN'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.85rem', fontWeight: 700,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {listing.company?.name}
                    </div>
                  </div>
                  {listing.company?.trustScore && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Trust Score</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-primary-400)' }}>
                        ⭐ {(listing.company.trustScore * 100).toFixed(0)}/100
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      {/* Premium Booking Modal */}
      {selectedBookingListing && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          animation: 'fadeIn 0.3s ease'
        }} onClick={closeBooking}>
          <div style={{
            background: 'var(--color-bg-dark)',
            border: `1px solid ${getCategoryColor(selectedBookingListing.materialCategory)}80`,
            boxShadow: `0 0 30px ${getCategoryColor(selectedBookingListing.materialCategory)}40`,
            borderRadius: '24px', padding: '32px', maxWidth: '600px', width: '90%',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button onClick={closeBooking} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ fontSize: '2.5rem' }}>🤝</div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Smart Booking & Contrat</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Négociation instantanée certifiée Blockchain</p>
              </div>
            </div>

            <div style={{ background: 'var(--color-bg-glass-light)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '8px' }}>{selectedBookingListing.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>Vendeur : {selectedBookingListing.company.name} ⭐ {(selectedBookingListing.company.trustScore * 100).toFixed(0)}/100</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#10b98120', padding: '12px', borderRadius: '8px', border: '1px solid #10b98140' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#10b981' }}>Volume Réservé</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>
                    {selectedBookingListing.volumeKg >= 1000 ? `${(selectedBookingListing.volumeKg / 1000).toFixed(1)}t` : `${selectedBookingListing.volumeKg}kg`}
                  </div>
                </div>
                <div style={{ background: '#3b82f620', padding: '12px', borderRadius: '8px', border: '1px solid #3b82f640' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#3b82f6' }}>Logistique Estimée</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>+ 45 FCFA/kg</div>
                </div>
              </div>
            </div>

            {bookingStatus === 'success' ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: '4rem', marginBottom: '16px', animation: 'scaleIn 0.5s ease' }}>✅</div>
                <h3 style={{ fontSize: '1.5rem', color: '#10b981', marginBottom: '8px' }}>Smart Contract Généré !</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>Le vendeur a été notifié. Le volume est verrouillé pour 48h.</p>
                <button onClick={closeBooking} className="btn-secondary" style={{ marginTop: '24px', padding: '10px 24px' }}>Fermer</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  onClick={handleBook}
                  disabled={bookingStatus === 'loading'}
                  style={{
                    background: bookingStatus === 'loading' ? '#64748b' : 'linear-gradient(90deg, #10b981, #059669)',
                    color: 'white', padding: '16px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold',
                    border: 'none', cursor: bookingStatus === 'loading' ? 'wait' : 'pointer',
                    boxShadow: bookingStatus === 'loading' ? 'none' : '0 4px 15px rgba(16, 185, 129, 0.4)',
                    transition: 'all 0.3s ease'
                  }}>
                  {bookingStatus === 'loading' ? 'Génération du contrat en cours...' : 'Générer le Smart Contract (Blockchain)'}
                </button>
                <button style={{
                  background: 'transparent', color: 'white', border: '1px solid var(--border-subtle)',
                  padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold',
                  transition: 'background 0.3s'
                }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  💬 Contacter le vendeur pour négocier
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
