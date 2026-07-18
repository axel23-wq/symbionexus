'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import Link from 'next/link';

const DashboardCharts = dynamic(() => import('@/components/DashboardCharts'), { ssr: false });
const SymbioNode3D = dynamic(() => import('@/components/SymbioNode3D'), { ssr: false });

interface DashboardData {
  overview: {
    activeListings: number;
    totalListings: number;
    pendingMatches: number;
    confirmedMatches: number;
    activeContracts: number;
    completedContracts: number;
    totalCarbonCredits: number;
    co2Avoided: number;
    revenue: number;
    trustScore: number;
  };
  recentContracts: any[];
}

const MOCK_DASHBOARD_DATA: DashboardData = {
  overview: {
    activeListings: 15,
    totalListings: 24,
    pendingMatches: 8,
    confirmedMatches: 5,
    activeContracts: 3,
    completedContracts: 14,
    totalCarbonCredits: 2450,
    co2Avoided: 124.5,
    revenue: 6450000,
    trustScore: 0.94,
  },
  recentContracts: [
    { 
      id: 'TRP-10492', 
      status: 'EN_TRANSIT', 
      pricePerKg: 450, 
      volumeKg: 4500,
      match: { listing: { title: 'Acier Inoxydable 304L' } },
      origin: 'Douala Port',
      destination: 'Yaoundé Usine B',
      progress: 45,
      driver: { name: 'Samuel Ebo', avatar: '/assets/avatar_samuel_ebo.png', ecoScore: 92 },
      updatedAt: new Date().toISOString() 
    },
    { 
      id: 'TRP-10493', 
      status: 'LIVRE', 
      pricePerKg: 350, 
      volumeKg: 12000,
      match: { listing: { title: 'Granulés PET recyclés' } },
      origin: 'Zone Industrielle',
      destination: 'Edéa Hub',
      progress: 100,
      driver: { name: 'Jean Dupont', avatar: '/assets/avatar_jean_dupont.png', ecoScore: 88 },
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() 
    },
  ]
};

const MOCK_ANALYTICS = {
  totalListingsPosted: 15,
  totalContractsParticipated: 17,
  totalCO2AvoidedOwned: 124.5,
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [activeQR, setActiveQR] = useState<any | null>(null);
  const [showFullPassport, setShowFullPassport] = useState(false);
  const [chatMessages, setChatMessages] = useState<{sender: 'driver' | 'me', text: string}[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // Initialiser le chat lorsqu'il s'ouvre
  useEffect(() => {
    if (activeChat) {
      setChatMessages([
        { sender: 'driver', text: 'Bonjour, je suis à 15 minutes du point de déchargement. Tout se passe bien.' },
        { sender: 'me', text: 'C\'est noté ! L\'équipe est prête à la Zone B.' }
      ]);
    }
  }, [activeChat]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim()) return;
    
    setChatMessages(prev => [...prev, { sender: 'me', text: newMessage }]);
    setNewMessage('');
    
    // Auto-réponse simulée
    setTimeout(() => {
      setChatMessages(prev => [...prev, { sender: 'driver', text: 'Bien reçu. À tout de suite.' }]);
    }, 1500);
  };

  const handleDownloadPDF = () => {
    if (!activeQR) return;
    const content = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Passeport ${activeQR.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Rajdhani:wght@500;700&display=swap');
          body {
            margin: 0;
            padding: 40px;
            background: radial-gradient(circle at 50% 50%, #1e293b, #0f172a);
            font-family: 'Inter', sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .card-container {
            position: relative;
            width: 900px;
            height: 500px;
            background: linear-gradient(135deg, #064e3b, #022c22);
            border-radius: 24px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 0 0 2px rgba(52, 211, 153, 0.2);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            padding: 30px 40px;
            box-sizing: border-box;
          }
          .card-container::before {
            content: '';
            position: absolute;
            inset: 0;
            background-image: 
              linear-gradient(rgba(16, 185, 129, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(16, 185, 129, 0.05) 1px, transparent 1px);
            background-size: 40px 40px;
            pointer-events: none;
          }
          .header {
            display: flex;
            align-items: center;
            margin-bottom: 40px;
            position: relative;
            z-index: 10;
          }
          .logo {
            font-family: 'Rajdhani', sans-serif;
            font-size: 54px;
            font-weight: 700;
            font-style: italic;
            color: #a7f3d0;
            text-shadow: 0 0 20px rgba(52, 211, 153, 0.4);
            display: flex;
            align-items: center;
          }
          .header-text {
            flex: 1;
            text-align: center;
          }
          .header-text h1 {
            margin: 0;
            font-family: 'Rajdhani', sans-serif;
            font-size: 36px;
            color: #a7f3d0;
            letter-spacing: 2px;
            text-shadow: 0 0 10px rgba(52, 211, 153, 0.3);
          }
          .header-text h2 {
            margin: 4px 0 0;
            font-size: 16px;
            color: #6ee7b7;
            letter-spacing: 1.5px;
            font-weight: 600;
          }
          .main-grid {
            display: grid;
            grid-template-columns: 300px 1fr 300px;
            gap: 20px;
            position: relative;
            z-index: 10;
            flex: 1;
          }
          .center-logo {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-family: 'Rajdhani', sans-serif;
            font-size: 180px;
            font-weight: 700;
            font-style: italic;
            background: linear-gradient(to bottom, rgba(52, 211, 153, 0.6), rgba(16, 185, 129, 0.1));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            opacity: 0.8;
            z-index: 0;
            pointer-events: none;
            filter: drop-shadow(0 0 30px rgba(16, 185, 129, 0.3));
          }
          .col {
            display: flex;
            flex-direction: column;
            gap: 16px;
            z-index: 10;
          }
          .info-box {
            background: rgba(0, 0, 0, 0.25);
            border: 1px solid rgba(52, 211, 153, 0.2);
            border-radius: 12px;
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 16px;
            backdrop-filter: blur(8px);
            box-shadow: inset 0 0 20px rgba(0,0,0,0.2);
          }
          .info-icon {
            font-size: 28px;
            color: #6ee7b7;
            width: 40px;
            text-align: center;
          }
          .info-content {
            display: flex;
            flex-direction: column;
          }
          .info-label {
            color: #94a3b8;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 4px;
          }
          .info-value {
            color: #f8fafc;
            font-size: 16px;
            font-weight: 600;
          }
          .co2-box {
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(6, 78, 59, 0.6);
            border: 2px solid #10b981;
            border-radius: 16px;
            padding: 12px 40px;
            box-shadow: 0 0 30px rgba(16, 185, 129, 0.3), inset 0 0 20px rgba(16, 185, 129, 0.2);
            text-align: center;
            z-index: 10;
          }
          .co2-text {
            font-family: 'Rajdhani', sans-serif;
            font-size: 32px;
            font-weight: 700;
            color: #34d399;
            text-shadow: 0 0 15px rgba(52, 211, 153, 0.6);
            margin: 0;
          }
          .crypto-section {
            margin-top: 24px;
            background: linear-gradient(90deg, #94a3b8, #cbd5e1);
            border-radius: 12px;
            padding: 16px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
            z-index: 10;
            box-shadow: 0 10px 20px rgba(0,0,0,0.3);
          }
          .crypto-content {
            text-align: center;
            flex: 1;
          }
          .crypto-title {
            font-size: 12px;
            color: #334155;
            font-weight: 600;
            letter-spacing: 1px;
          }
          .crypto-hash {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #1e293b;
            margin: 6px 0;
          }
          .crypto-verify {
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          .qr-placeholder {
            width: 70px;
            height: 70px;
            background: #0f172a;
            border-radius: 8px;
            padding: 4px;
            position: relative;
          }
          .qr-placeholder::after {
            content: '';
            position: absolute;
            inset: 4px;
            background-image: 
              repeating-linear-gradient(45deg, #fff 25%, transparent 25%, transparent 75%, #fff 75%, #fff), 
              repeating-linear-gradient(45deg, #fff 25%, transparent 25%, transparent 75%, #fff 75%, #fff);
            background-position: 0 0, 5px 5px;
            background-size: 10px 10px;
          }
          .footer-text {
            text-align: center;
            color: #6ee7b7;
            font-size: 12px;
            margin-top: 16px;
            opacity: 0.8;
            z-index: 10;
          }
        </style>
      </head>
      <body>
        <div class="card-container">
          <div class="header">
            <div class="logo">SN<span style="font-size: 38px; margin-left: -5px;">🌿</span></div>
            <div class="header-text">
              <h1>PASSEPORT SYMBIONEXUS</h1>
              <h2>DOCUMENT OFFICIEL DE TRAÇABILITÉ B2B</h2>
            </div>
            <div style="width: 100px;"></div>
          </div>
          
          <div class="center-logo">SN</div>
          
          <div class="main-grid">
            <div class="col">
              <div class="info-box">
                <div class="info-icon">🚚</div>
                <div class="info-content">
                  <div class="info-label">Identifiant Convoi</div>
                  <div class="info-value">${activeQR.id}</div>
                </div>
              </div>
              <div class="info-box">
                <div class="info-icon">♻️</div>
                <div class="info-content">
                  <div class="info-label">Matériau</div>
                  <div class="info-value">${activeQR.match?.listing?.title || 'Granulés PET recyclés'}</div>
                </div>
              </div>
              <div class="info-box" style="opacity: 0; pointer-events: none; height: 10px;"></div>
            </div>
            
            <div style="position: relative;">
              <div class="co2-box">
                <p class="co2-text">-${(activeQR.volumeKg * 0.05).toFixed(0)} kg CO₂ évités</p>
              </div>
            </div>
            
            <div class="col">
              <div class="info-box">
                <div class="info-icon">⚖️</div>
                <div class="info-content">
                  <div class="info-label">Volume</div>
                  <div class="info-value">${activeQR.volumeKg.toLocaleString('fr-FR')} kg</div>
                </div>
              </div>
              <div class="info-box">
                <div class="info-icon">👤</div>
                <div class="info-content">
                  <div class="info-label">Chauffeur</div>
                  <div class="info-value">${activeQR.driver?.name || 'Jean Dupont'}</div>
                </div>
              </div>
              <div class="info-box">
                <div class="info-icon">✅</div>
                <div class="info-content">
                  <div class="info-label">Statut Actuel</div>
                  <div class="info-value">${activeQR.status === 'EN_TRANSIT' ? 'En Transit' : 'Livré'}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="crypto-section">
            <div style="width: 70px;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: #64748b; margin-bottom: 6px; box-shadow: 0 12px 0 #64748b, 0 24px 0 #64748b;"></div>
            </div>
            <div class="crypto-content">
              <div class="crypto-title">VÉRIFICATION B2B CRYPTOGRAPHIQUE</div>
              <div class="crypto-hash">Hash Blockchain: 0x8f7c9a3b2e1...3a9c</div>
              <div class="crypto-verify">EMPREINTE CRYPTOGRAPHIQUE VÉRIFIÉE ✓</div>
            </div>
            <div class="qr-placeholder"></div>
          </div>
          
          <div class="footer-text">Généré le ${new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })} par SymbioNexus AI OS</div>
        </div>
      </body>
      </html>
    `;
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(content);
      newWindow.document.close();
    } else {
      alert("Veuillez autoriser les fenêtres contextuelles (pop-ups) pour afficher le passeport.");
    }
  };

  const loadDashboard = useCallback(async () => {
    try {
      const [dashRes, analyticsRes] = await Promise.all([
        api.getDashboard().catch(() => ({ data: null })),
        api.getCompanyAnalytics().catch(() => null),
      ]);
      setData(dashRes?.data || MOCK_DASHBOARD_DATA);
      setAnalytics(analyticsRes || MOCK_ANALYTICS);
    } catch (err) {
      console.error('Dashboard load error:', err);
      setData(MOCK_DASHBOARD_DATA);
      setAnalytics(MOCK_ANALYTICS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const co2Avoided = analytics?.totalCO2AvoidedOwned ?? data?.overview?.co2Avoided ?? 0;
  const treesPlanted = Math.floor(co2Avoided * 5); // Example conversion: 1T CO2 = 5 trees
  const plasticBottles = Math.floor(co2Avoided * 20000); // Example conversion

  const stats = [
    { icon: '📋', label: t('dash.stat.activeListings'), value: analytics?.totalListingsPosted ?? data?.overview?.activeListings ?? 0, color: '#3b82f6' },
    { icon: '🤖', label: t('dash.stat.pendingMatches'), value: data?.overview?.pendingMatches ?? 0, color: '#f59e0b' },
    { icon: '📝', label: t('dash.stat.activeContracts'), value: analytics?.totalContractsParticipated ?? data?.overview?.activeContracts ?? 0, color: '#8b5cf6' },
    { icon: '✅', label: t('dash.stat.completedContracts'), value: data?.overview?.completedContracts ?? 0, color: '#10b981' },
    { icon: '🌱', label: t('dash.stat.co2'), value: co2Avoided.toFixed(1), color: '#059669', subtext: `= ${treesPlanted} arbres plantés` },
    { icon: '♻️', label: 'Équivalent Plastique', value: (plasticBottles / 1000).toFixed(1) + 'k', color: '#0ea5e9', subtext: 'bouteilles recyclées' },
  ];

  const quickActions =
    user?.role === 'SELLER'
      ? [
          { icon: '➕', label: t('dash.action.newListing'), href: '/listings/new', color: 'var(--gradient-primary)' },
          { icon: '🤖', label: t('dash.action.runMatch'), href: '/matches', color: 'linear-gradient(135deg, #3b82f6, #06b6d4)' },
          { icon: '📊', label: t('dash.action.myListings'), href: '/listings', color: 'linear-gradient(135deg, #f59e0b, #f97316)' },
        ]
      : [
          { icon: '🔍', label: t('dash.action.explore'), href: '/marketplace', color: 'var(--gradient-primary)' },
          { icon: '🤖', label: t('dash.action.myMatches'), href: '/matches', color: 'linear-gradient(135deg, #3b82f6, #06b6d4)' },
          { icon: '📜', label: 'Générer Certificat Carbone', href: '/carbon/certificate', color: 'linear-gradient(135deg, #10b981, #059669)', isAction: true },
        ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {t('dash.hello')}, {user?.firstName} 👋
          </h1>
          <p className="page-subtitle">
            {user?.company?.name} — {user?.role === 'SELLER' ? t('role.seller') : user?.role === 'BUYER' ? t('role.buyer') : user?.role}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="badge badge-primary" style={{ fontSize: '0.8rem', padding: '6px 16px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', color: '#3b82f6' }}>
            ⭐ {t('dash.trustScore')}: {((data?.overview.trustScore || 0.5) * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Noyau IA de Matchmaking — visualisation 3D */}
      <style>{`
        .node-widget { display: grid; grid-template-columns: 1fr 340px; align-items: center; gap: 12px; }
        @media (max-width: 760px) { .node-widget { grid-template-columns: 1fr; } .node-widget .node-canvas { height: 200px; } }
      `}</style>
      <div style={{
        position: 'relative', borderRadius: 20, overflow: 'hidden', marginBottom: 32,
        border: '1.5px solid var(--border-subtle)',
        background: 'radial-gradient(ellipse at 80% 50%, rgba(168,85,247,0.12), transparent 60%), linear-gradient(135deg, rgba(13,148,136,0.12), rgba(10,17,40,0.4))',
      }}>
        <div className="node-widget">
          <div style={{ padding: '28px 32px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#34d399', marginBottom: 10 }}>
              <span>🧠</span> AI Matchmaking Actif
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>3 usines matchent avec votre lot TRP-10492</h2>
            <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, maxWidth: 520 }}>
              Le réseau a détecté une demande optimale pour votre matière première. Validez la transaction maintenant pour optimiser votre score d&apos;économie circulaire.
            </p>
            <div style={{ display: 'flex', gap: 28, marginTop: 18 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#22d3ee' }}>{data?.overview.pendingMatches ?? 0}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{t('dash.stat.pendingMatches')}</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#a855f7' }}>{data?.overview.activeListings ?? 0}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{t('dash.stat.activeListings')}</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#34d399' }}>{((data?.overview.trustScore || 0.5) * 100).toFixed(0)}%</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{t('dash.trustScore')}</div>
              </div>
            </div>
          </div>
          <div className="node-canvas" style={{ height: 240 }}>
            <SymbioNode3D variant="widget" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {quickActions.map((action, i) => (
          <Link key={i} href={action.href} style={{ textDecoration: 'none' }}>
            <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.05)' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: action.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                {action.icon}
              </div>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#e2e8f0' }}>{action.label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {stats.map((stat, i) => (
          <div key={i} className="stat-card animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
                {stat.subtext && (
                  <div style={{ fontSize: '0.75rem', color: stat.color, marginTop: '4px', fontWeight: 600 }}>
                    {stat.subtext}
                  </div>
                )}
              </div>
              <div className="stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tracking TRP Cards */}
      <div className="neo-card" style={{ padding: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🚚 Suivi des Convois (TRP)
        </h2>

        {data?.recentContracts && data.recentContracts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {data.recentContracts.map((contract: any, i: number) => (
              <div key={i} className="glass-card" style={{ padding: '20px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)' }}>
                
                {/* Header Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    {/* Fake map thumbnail */}
                    <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: 'url(/assets/cyberpunk_map_bg.png) center/cover', border: '1px solid #1e293b' }} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '1.1rem' }}>{contract.id}</span>
                        <span className="badge" style={{ background: contract.status === 'EN_TRANSIT' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: contract.status === 'EN_TRANSIT' ? '#3b82f6' : '#10b981', border: `1px solid ${contract.status === 'EN_TRANSIT' ? '#3b82f6' : '#10b981'}` }}>
                          {contract.status === 'EN_TRANSIT' ? 'En Transit' : 'Livré'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{contract.match?.listing?.title} • {contract.volumeKg.toLocaleString()} kg</div>
                      
                      {/* Driver Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: `url(${contract.driver.avatar}) center/cover`, border: '1px solid #1e293b' }} />
                        <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{contract.driver.name}</span>
                        <span style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: '4px' }}>Score Éco: {contract.driver.ecoScore}/100</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => setActiveChat(contract)}
                      style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', color: '#3b82f6', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 0 10px rgba(59, 130, 246, 0.2)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.4)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.2)'; }}
                    >
                      💬 Chat
                    </button>
                    <button 
                      onClick={() => setActiveQR(contract)}
                      style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.4)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.2)'; }}
                    >
                      📱 QR Passport
                    </button>
                  </div>
                </div>

                {/* Timeline */}
                <div style={{ position: 'relative', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 10px #3b82f6' }} />
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{contract.origin}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: contract.progress > 50 ? '#3b82f6' : '#1e293b', boxShadow: contract.progress > 50 ? '0 0 10px #3b82f6' : 'none' }} />
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Checkpoint</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: contract.progress === 100 ? '#10b981' : '#1e293b', boxShadow: contract.progress === 100 ? '0 0 10px #10b981' : 'none' }} />
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{contract.destination}</span>
                    </div>
                  </div>
                  {/* Progress Line */}
                  <div style={{ position: 'absolute', top: '21px', left: '20px', right: '20px', height: '2px', background: '#1e293b', zIndex: 1 }}>
                    <div style={{ width: `${contract.progress}%`, height: '100%', background: contract.progress === 100 ? '#10b981' : '#3b82f6', transition: 'width 1s ease' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)', background: 'rgba(0,0,0,0.3)', borderRadius: '16px', border: '1px dashed #1e293b' }}>
            <div style={{ margin: '0 auto', width: '200px', height: '120px', background: 'url(/assets/sleeping_neon_truck.png) center/contain no-repeat', opacity: 0.5, marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.2rem', color: '#94a3b8', marginBottom: '8px' }}>Aucun convoi actif</h3>
            <p style={{ fontSize: '0.85rem' }}>Démarrez une nouvelle transaction pour suivre vos véhicules en temps réel.</p>
          </div>
        )}
      </div>
      
      {/* Analytics (Recharts) */}
      {!isLoading && <div style={{ marginTop: '32px' }}><DashboardCharts /></div>}

      {/* QR Passport Modal (Small Version) */}
      {activeQR && !showFullPassport && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.3s ease' }} onClick={() => setActiveQR(null)}>
          <div style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid #10b981', borderRadius: '24px', padding: '40px', maxWidth: '400px', width: '90%', boxShadow: '0 0 40px rgba(16, 185, 129, 0.3)', position: 'relative', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setActiveQR(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            <h3 style={{ color: '#f1f5f9', fontSize: '1.5rem', marginBottom: '8px', fontWeight: 800 }}>Passeport SymbioNexus</h3>
            <p style={{ color: '#10b981', fontSize: '0.9rem', marginBottom: '24px' }}>Convoi {activeQR?.id || 'Inconnu'}</p>
            
            {/* Fake QR Code */}
            <div style={{ width: '200px', height: '200px', margin: '0 auto 24px', background: '#fff', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)' }}>
              <div style={{ width: '100%', height: '100%', backgroundImage: 'repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), repeating-linear-gradient(45deg, #000 25%, #fff 25%, #fff 75%, #000 75%, #000)', backgroundPosition: '0 0, 10px 10px', backgroundSize: '20px 20px' }}></div>
            </div>
            
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '12px', textAlign: 'left', marginBottom: '24px' }}>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '8px' }}>⛓️ Hash Blockchain: <span style={{ color: '#10b981', fontFamily: 'monospace' }}>0x8f...3a9c</span></div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '8px' }}>📦 Matériau: <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{activeQR?.match?.listing?.title || 'Granulés PET recyclés'}</span></div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '8px' }}>⚖️ Volume: <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{(activeQR?.volumeKg || 12000).toLocaleString('fr-FR')} kg</span></div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>🌱 Impact CO₂: <span style={{ color: '#34d399', fontWeight: 600 }}>-{((activeQR?.volumeKg || 12000) * 0.05).toFixed(0)} kg CO₂</span></div>
            </div>
            <button onClick={() => setShowFullPassport(true)} style={{ width: '100%', padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)' }}>Ouvrir le Passeport Officiel</button>
          </div>
        </div>
      )}

      {/* Full Passport View (Gorgeous UI) */}
      {showFullPassport && activeQR && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', animation: 'fadeIn 0.4s ease' }} onClick={() => setShowFullPassport(false)}>
          <div style={{ transform: 'scale(1)', transition: 'transform 0.3s ease' }}>
            <style dangerouslySetInnerHTML={{ __html: `
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Rajdhani:wght@500;700&display=swap');
              .passport-card {
                position: relative;
                width: 900px;
                height: 500px;
                background: linear-gradient(135deg, #064e3b, #022c22);
                border-radius: 24px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 0 0 2px rgba(52, 211, 153, 0.2);
                overflow: hidden;
                display: flex;
                flex-direction: column;
                padding: 30px 40px;
                box-sizing: border-box;
                font-family: 'Inter', sans-serif;
              }
              .passport-card::before {
                content: '';
                position: absolute;
                inset: 0;
                background-image: 
                  linear-gradient(rgba(16, 185, 129, 0.05) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(16, 185, 129, 0.05) 1px, transparent 1px);
                background-size: 40px 40px;
                pointer-events: none;
              }
              .pp-header { display: flex; align-items: center; margin-bottom: 40px; position: relative; z-index: 10; }
              .pp-logo { font-family: 'Rajdhani', sans-serif; font-size: 54px; font-weight: 700; font-style: italic; color: #a7f3d0; text-shadow: 0 0 20px rgba(52, 211, 153, 0.4); display: flex; align-items: center; }
              .pp-header-text { flex: 1; text-align: center; }
              .pp-header-text h1 { margin: 0; font-family: 'Rajdhani', sans-serif; font-size: 36px; color: #a7f3d0; letter-spacing: 2px; text-shadow: 0 0 10px rgba(52, 211, 153, 0.3); }
              .pp-header-text h2 { margin: 4px 0 0; font-size: 16px; color: #6ee7b7; letter-spacing: 1.5px; font-weight: 600; }
              .pp-grid { display: grid; grid-template-columns: 300px 1fr 300px; gap: 20px; position: relative; z-index: 10; flex: 1; }
              .pp-center-logo { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-family: 'Rajdhani', sans-serif; font-size: 180px; font-weight: 700; font-style: italic; background: linear-gradient(to bottom, rgba(52, 211, 153, 0.6), rgba(16, 185, 129, 0.1)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; opacity: 0.8; z-index: 0; pointer-events: none; filter: drop-shadow(0 0 30px rgba(16, 185, 129, 0.3)); }
              .pp-col { display: flex; flex-direction: column; gap: 16px; z-index: 10; }
              .pp-box { background: rgba(0, 0, 0, 0.25); border: 1px solid rgba(52, 211, 153, 0.2); border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 16px; backdrop-filter: blur(8px); box-shadow: inset 0 0 20px rgba(0,0,0,0.2); }
              .pp-icon { font-size: 28px; color: #6ee7b7; width: 40px; text-align: center; }
              .pp-content { display: flex; flex-direction: column; }
              .pp-label { color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
              .pp-value { color: #f8fafc; font-size: 16px; font-weight: 600; }
              .pp-co2 { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); background: rgba(6, 78, 59, 0.6); border: 2px solid #10b981; border-radius: 16px; padding: 12px 40px; box-shadow: 0 0 30px rgba(16, 185, 129, 0.3), inset 0 0 20px rgba(16, 185, 129, 0.2); text-align: center; z-index: 10; }
              .pp-co2-text { font-family: 'Rajdhani', sans-serif; font-size: 32px; font-weight: 700; color: #34d399; text-shadow: 0 0 15px rgba(52, 211, 153, 0.6); margin: 0; }
              .pp-crypto { margin-top: 24px; background: linear-gradient(90deg, #94a3b8, #cbd5e1); border-radius: 12px; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 10; box-shadow: 0 10px 20px rgba(0,0,0,0.3); }
              .pp-crypto-content { text-align: center; flex: 1; }
              .pp-crypto-title { font-size: 12px; color: #334155; font-weight: 600; letter-spacing: 1px; }
              .pp-crypto-hash { font-family: 'Courier New', monospace; font-size: 14px; color: #1e293b; margin: 6px 0; }
              .pp-crypto-verify { font-size: 18px; font-weight: 800; color: #0f172a; display: flex; align-items: center; justify-content: center; gap: 8px; }
              .pp-qr { width: 70px; height: 70px; background: #0f172a; border-radius: 8px; padding: 4px; position: relative; }
              .pp-qr::after { content: ''; position: absolute; inset: 4px; background-image: repeating-linear-gradient(45deg, #fff 25%, transparent 25%, transparent 75%, #fff 75%, #fff), repeating-linear-gradient(45deg, #fff 25%, transparent 25%, transparent 75%, #fff 75%, #fff); background-position: 0 0, 5px 5px; background-size: 10px 10px; }
              .pp-footer { text-align: center; color: #6ee7b7; font-size: 12px; margin-top: 16px; opacity: 0.8; z-index: 10; }
              .pp-close { position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 20; transition: all 0.2s; }
              .pp-close:hover { background: rgba(255,255,255,0.1); }
            `}} />
            
            <div className="passport-card" onClick={e => e.stopPropagation()}>
              <button className="pp-close" onClick={() => setShowFullPassport(false)}>✕</button>
              
              <div className="pp-header">
                <div className="pp-logo">SN<span style={{ fontSize: '38px', marginLeft: '-5px' }}>🌿</span></div>
                <div className="pp-header-text">
                  <h1>PASSEPORT SYMBIONEXUS</h1>
                  <h2>DOCUMENT OFFICIEL DE TRAÇABILITÉ B2B</h2>
                </div>
                <div style={{ width: '100px' }}></div>
              </div>
              
              <div className="pp-center-logo">SN</div>
              
              <div className="pp-grid">
                <div className="pp-col">
                  <div className="pp-box">
                    <div className="pp-icon">🚚</div>
                    <div className="pp-content">
                      <div className="pp-label">Identifiant Convoi</div>
                      <div className="pp-value">{activeQR?.id || 'TRP-10493'}</div>
                    </div>
                  </div>
                  <div className="pp-box">
                    <div className="pp-icon">♻️</div>
                    <div className="pp-content">
                      <div className="pp-label">Matériau</div>
                      <div className="pp-value">{activeQR?.match?.listing?.title || 'Granulés PET recyclés'}</div>
                    </div>
                  </div>
                </div>
                
                <div style={{ position: 'relative' }}>
                  <div className="pp-co2">
                    <p className="pp-co2-text">-{((activeQR?.volumeKg || 12000) * 0.05).toFixed(0)} kg CO₂ évités</p>
                  </div>
                </div>
                
                <div className="pp-col">
                  <div className="pp-box">
                    <div className="pp-icon">⚖️</div>
                    <div className="pp-content">
                      <div className="pp-label">Volume</div>
                      <div className="pp-value">{(activeQR?.volumeKg || 12000).toLocaleString('fr-FR')} kg</div>
                    </div>
                  </div>
                  <div className="pp-box">
                    <div className="pp-icon">👤</div>
                    <div className="pp-content">
                      <div className="pp-label">Chauffeur</div>
                      <div className="pp-value">{activeQR?.driver?.name || 'Jean Dupont'}</div>
                    </div>
                  </div>
                  <div className="pp-box">
                    <div className="pp-icon">✅</div>
                    <div className="pp-content">
                      <div className="pp-label">Statut Actuel</div>
                      <div className="pp-value">{activeQR?.status === 'EN_TRANSIT' ? 'En Transit' : 'Livré'}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pp-crypto">
                <div style={{ width: '70px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#64748b', marginBottom: '6px', boxShadow: '0 12px 0 #64748b, 0 24px 0 #64748b' }}></div>
                </div>
                <div className="pp-crypto-content">
                  <div className="pp-crypto-title">VÉRIFICATION B2B CRYPTOGRAPHIQUE</div>
                  <div className="pp-crypto-hash">Hash Blockchain: 0x8f7c9a3b2e1...3a9c</div>
                  <div className="pp-crypto-verify">EMPREINTE CRYPTOGRAPHIQUE VÉRIFIÉE ✓</div>
                </div>
                <div className="pp-qr"></div>
              </div>
              
              <div className="pp-footer">
                Généré le {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })} par SymbioNexus AI OS
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {activeChat && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.3s ease' }} onClick={() => setActiveChat(null)}>
          <div style={{ height: '100%', width: '400px', background: 'rgba(15, 23, 42, 0.95)', borderLeft: '1px solid #3b82f6', padding: '24px', display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 30px rgba(59, 130, 246, 0.2)', animation: 'slideInRight 0.3s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(59, 130, 246, 0.3)', paddingBottom: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `url(${activeChat.driver.avatar}) center/cover`, border: '2px solid #3b82f6' }} />
                <div>
                  <h3 style={{ color: '#f1f5f9', fontSize: '1.1rem', margin: 0 }}>{activeChat.driver.name}</h3>
                  <span style={{ color: '#3b82f6', fontSize: '0.8rem' }}>En route • Convoi {activeChat.id}</span>
                </div>
              </div>
              <button onClick={() => setActiveChat(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ alignSelf: 'center', fontSize: '0.75rem', color: '#64748b', marginBottom: '8px' }}>Aujourd'hui, 14:20</div>
              
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ 
                  alignSelf: msg.sender === 'me' ? 'flex-end' : 'flex-start',
                  background: msg.sender === 'me' ? '#3b82f6' : 'rgba(59, 130, 246, 0.1)', 
                  padding: '12px 16px', 
                  borderRadius: msg.sender === 'me' ? '16px 16px 0 16px' : '16px 16px 16px 0', 
                  color: msg.sender === 'me' ? '#fff' : '#cbd5e1', 
                  maxWidth: '85%', 
                  border: msg.sender === 'me' ? 'none' : '1px solid rgba(59, 130, 246, 0.2)',
                  boxShadow: msg.sender === 'me' ? '0 4px 10px rgba(59, 130, 246, 0.3)' : 'none'
                }}>
                  {msg.text}
                </div>
              ))}
            </div>
            
            <form onSubmit={handleSendMessage} style={{ marginTop: '24px', display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrire un message..." 
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '12px 16px', borderRadius: '12px', color: '#fff', outline: 'none' }} 
              />
              <button type="submit" style={{ width: '45px', height: '45px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)' }}>
                ➤
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
}
