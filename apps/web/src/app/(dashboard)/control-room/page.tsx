'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import Image from 'next/image';

const SymbioNode3D = dynamic(() => import('@/components/SymbioNode3D'), { ssr: false });

type ActionType = 'IDLE' | 'SHORTAGES' | 'PREDICTIONS' | 'FRAUD' | 'CAPACITY' | 'TRUST';

const MOCK_GLOBAL_STATS = {
  status: 'OPTIMAL - IA ACTIVE',
  globalThreatLevel: 'FAIBLE',
  activeScans: 12458,
  strategicInsight: "Le réseau opère à 84% d'efficacité. Une perturbation logistique majeure est détectée dans la zone littorale (Douala) suite aux intempéries. Redistribution automatique des flux de matériaux activée pour compenser."
};

const MOCK_SHORTAGES = [
  { resource: 'Aluminium Industriel', impact: 'Critique - Chaîne prod. menacée', status: 'CRITICAL_SHORTAGE', deficit: 450, matchedSurplus: 120 },
  { resource: 'PET Recyclé (rPET)', impact: 'Élevé - Hausse des prix locaux', status: 'SHORTAGE', deficit: 800, matchedSurplus: 450 },
  { resource: 'Cuivre (Câbles)', impact: 'Moyen - Retards logistiques', status: 'WARNING', deficit: 150, matchedSurplus: 100 },
];

const MOCK_PREDICTIONS = {
  aiInsight: "L'algorithme prédictif anticipe une rupture d'approvisionnement en PET de grade alimentaire sous 14 jours en raison des quotas d'exportation. Recommandation : Verrouillage immédiat des contrats existants.",
  forecast30Days: [
    { sector: 'Plastiques (rPET)', trend: 'UP', priceExpectedVariation: '+15.4%', confidence: '94%' },
    { sector: 'Métaux Ferreux', trend: 'DOWN', priceExpectedVariation: '-2.1%', confidence: '88%' },
    { sector: 'Biomasse (Coques)', trend: 'UP', priceExpectedVariation: '+8.5%', confidence: '91%' },
  ]
};

const MOCK_FRAUD = [
  { severity: 'CRITICAL', company: 'Global Traders SARL', type: 'USURPATION IDENTITÉ', detail: 'Tentative de validation de cargaison avec de faux documents douaniers détectée via analyse sémantique des PDF.' },
  { severity: 'WARNING', company: 'EcoRecycle Pro', type: 'DIVERGENCE POIDS', detail: 'Écart de 12% détecté entre le poids déclaré (IoT Balance) et le poids contractuel. Vérification requise.' },
  { severity: 'WARNING', company: 'TransLogistics', type: 'TRAJET ANORMAL', detail: 'Déviation de la route GPS prévue de 45km. Risque de détournement de la matière.' },
];

const MOCK_CAPACITY = {
  globalEfficiency: '84%',
  overloadedHubs: [
    { name: 'Hub Douala Port', load: '115%', suggestedAction: 'Rediriger le flux vers Hub Edéa' },
    { name: 'Centre Tri Yaoundé', load: '98%', suggestedAction: 'Activer le stockage tampon secondaire' }
  ],
  emptyHubs: [
    { name: 'Hub Bafoussam', load: '22%', suggestedAction: 'Lancer campagne de collecte locale ciblée' },
    { name: 'Zone Industrielle Kribi', load: '45%', suggestedAction: 'Ouvrir aux flux de transit' }
  ]
};

const MOCK_TRUST = [
  { score: 98, company: 'Acieries du Wouri', history: '142 transactions réussies, 0 litige, certification ISO14001 vérifiée.', status: 'EXCELLENT' },
  { score: 85, company: 'PlastRecycle Ltd', history: '45 transactions, 1 retard de paiement réglé. Qualité matière constante.', status: 'FIABLE' },
  { score: 42, company: 'MetalImport XYZ', history: '3 litiges récents pour qualité non-conforme. Profil sous surveillance.', status: 'À RISQUE' },
];

export default function ControlRoomPage() {
  const [activeAction, setActiveAction] = useState<ActionType>('IDLE');
  const [isLoading, setIsLoading] = useState(false);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [actionData, setActionData] = useState<any>(null);
  const [co2Value, setCo2Value] = useState(0);

  useEffect(() => {
    setGlobalStats(MOCK_GLOBAL_STATS);
    
    // Animation of the CO2 gauge
    const timer = setTimeout(() => {
      setCo2Value(84); // Animates to 84%
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleAction = async (type: ActionType) => {
    setActiveAction(type);
    
    if (type === 'IDLE') {
      setActionData(null);
      return;
    }

    setIsLoading(true);
    setActionData(null);

    // Simulate AI processing delay for realism
    setTimeout(async () => {
      try {
        let res;
        switch (type) {
          case 'SHORTAGES': res = MOCK_SHORTAGES; break;
          case 'PREDICTIONS': res = MOCK_PREDICTIONS; break;
          case 'FRAUD': res = MOCK_FRAUD; break;
          case 'CAPACITY': res = MOCK_CAPACITY; break;
          case 'TRUST': res = MOCK_TRUST; break;
        }

        // Try API, override if valid data
        try {
          let apiRes;
          switch (type) {
            case 'SHORTAGES': apiRes = await api.getMIShortages(); break;
            case 'PREDICTIONS': apiRes = await api.getMIPredictions(); break;
            case 'FRAUD': apiRes = await api.getMIFraudDetection(); break;
            case 'CAPACITY': apiRes = await api.getMICapacityBalancing(); break;
            case 'TRUST': apiRes = await api.getMITrustScores(); break;
          }
          if (apiRes) {
            const actualData = apiRes.data !== undefined ? apiRes.data : apiRes;
            if ((Array.isArray(actualData) && actualData.length > 0) || (actualData && !Array.isArray(actualData) && Object.keys(actualData).length > 0)) {
              res = actualData;
            }
          }
        } catch (err) {
          console.warn(`API unavailable for ${type}, using premium mock data`);
        }

        setActionData(res);
      } finally {
        setIsLoading(false);
      }
    }, 1200); // 1.2s delay
  };

  const getThemeColor = () => {
    switch (activeAction) {
      case 'SHORTAGES': return '#ef4444';
      case 'PREDICTIONS': return '#3b82f6';
      case 'FRAUD': return '#f59e0b';
      case 'CAPACITY': return '#10b981';
      case 'TRUST': return '#0ea5e9';
      default: return '#94a3b8';
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 100px)', overflow: 'hidden', borderRadius: '24px', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)' }}>
      
      {/* Background Ambience */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.2, filter: `drop-shadow(0 0 30px ${getThemeColor()}33)`, pointerEvents: 'none' }}>
        <SymbioNode3D variant="widget" />
      </div>

      <div style={{ position: 'relative', zIndex: 10, padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
              Salle de Contrôle IA 🌐
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '1rem', marginTop: '4px' }}>
              Surveillance Multi-Flux & Intelligence Stratégique
            </p>
          </div>
          
          <div className="glass-card" style={{ padding: '12px 20px', background: 'rgba(0,0,0,0.6)', border: `1px solid ${getThemeColor()}55` }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Statut du Noyau</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: getThemeColor(), boxShadow: `0 0 10px ${getThemeColor()}` }} />
              <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{globalStats?.status || 'SYNCHRONISATION...'}</span>
            </div>
          </div>
        </div>

        {/* WALL OF SCREENS GRID */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '2fr 1fr', gridTemplateRows: '1fr 1fr', gap: '20px', minHeight: 0 }}>
          
          {/* SCREEN 1: DYNAMIC ACTION PANEL OR GPS MAP */}
          <div className="glass-card" style={{ gridRow: 'span 2', position: 'relative', overflow: 'hidden', border: `1px solid ${activeAction !== 'IDLE' ? getThemeColor() : '#1e293b'}`, padding: 0 }}>
            {activeAction === 'IDLE' ? (
              // GPS Map Default State
              <>
                <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 20, background: 'rgba(0,0,0,0.8)', padding: '6px 12px', borderRadius: '8px', border: '1px solid #3b82f6', color: '#3b82f6', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  🔴 EN DIRECT : HEATMAP LOGISTIQUE
                </div>
                <div style={{ position: 'absolute', inset: 0, background: 'url(/assets/cyberpunk_map_bg.png) center/cover' }} />
                
                <div className="pulsing-dot" style={{ top: '30%', left: '40%', background: 'rgba(239, 68, 68, 0.8)', boxShadow: '0 0 30px 15px rgba(239, 68, 68, 0.4)' }} />
                <div className="pulsing-dot" style={{ top: '60%', left: '70%', background: 'rgba(16, 185, 129, 0.8)', boxShadow: '0 0 40px 20px rgba(16, 185, 129, 0.4)' }} />
                <div className="pulsing-dot" style={{ top: '45%', left: '25%', background: 'rgba(59, 130, 246, 0.8)', boxShadow: '0 0 25px 10px rgba(59, 130, 246, 0.4)' }} />
                
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                  <path d="M 150 400 Q 250 350 400 300 T 700 200" fill="transparent" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="3" strokeDasharray="10,10" className="animated-path" />
                  <circle cx="0" cy="0" r="5" fill="#3b82f6" className="moving-truck">
                    <animateMotion dur="8s" repeatCount="indefinite" path="M 150 400 Q 250 350 400 300 T 700 200" />
                  </circle>
                </svg>
              </>
            ) : (
              // Dynamic Action Data
              <div style={{ padding: '32px', height: '100%', overflowY: 'auto', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)' }}>
                {isLoading ? (
                  <div style={{ textAlign: 'center', padding: '80px 40px' }}>
                    <div style={{ fontSize: '3rem', animation: 'spin 2s linear infinite' }}>⚙️</div>
                    <div style={{ marginTop: '16px', color: getThemeColor(), fontWeight: 600 }}>Analyse Deep-Learning en cours...</div>
                  </div>
                ) : (
                  <>
                    <h2 style={{ color: getThemeColor(), borderBottom: `1px solid ${getThemeColor()}33`, paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>
                        {activeAction === 'SHORTAGES' && '⚠️ Analyse Pénuries & Menaces'}
                        {activeAction === 'PREDICTIONS' && '📈 Prévisions Offre-Demande'}
                        {activeAction === 'FRAUD' && '🛡️ Rapport d&apos;Anomalies et Fraudes'}
                        {activeAction === 'CAPACITY' && '⚖️ Équilibrage Dynamique des Flux'}
                        {activeAction === 'TRUST' && '🤝 Évaluation & Scores de Confiance'}
                      </span>
                      <button onClick={() => setActiveAction('IDLE')} style={{ background: 'transparent', border: '1px solid #1e293b', color: '#94a3b8', borderRadius: '8px', cursor: 'pointer', padding: '4px 12px' }}>✕ Retour Carte</button>
                    </h2>
                    
                    {/* SHORTAGES */}
                    {activeAction === 'SHORTAGES' && Array.isArray(actionData) && actionData.map((item: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.05)', marginBottom: '8px', borderRadius: '8px', borderLeft: `4px solid ${item.status === 'CRITICAL_SHORTAGE' ? '#ef4444' : '#f59e0b'}` }}>
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1.1rem' }}>{item.resource}</div>
                          <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '4px' }}>Impact: {item.impact}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: item.status === 'CRITICAL_SHORTAGE' ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{item.status}</div>
                          <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>Déficit: {item.deficit}t | Surplus: {item.matchedSurplus}t</div>
                        </div>
                      </div>
                    ))}

                    {/* PREDICTIONS */}
                    {activeAction === 'PREDICTIONS' && actionData && (
                      <div>
                        <div style={{ padding: '20px', background: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid #3b82f6', color: '#e2e8f0', marginBottom: '24px', fontSize: '1.1rem', lineHeight: 1.5 }}>
                          ✨ {actionData.aiInsight}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                          {Array.isArray(actionData.forecast30Days) && actionData.forecast30Days.map((f: any, i: number) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                              <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>{f.sector}</div>
                              <div style={{ color: f.trend === 'UP' ? '#ef4444' : f.trend === 'DOWN' ? '#10b981' : '#94a3b8', fontSize: '2rem', margin: '12px 0', fontWeight: 900 }}>{f.priceExpectedVariation}</div>
                              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Confiance IA: <span style={{ color: '#3b82f6' }}>{f.confidence}</span></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* FRAUD */}
                    {activeAction === 'FRAUD' && Array.isArray(actionData) && actionData.map((item: any, i: number) => (
                      <div key={i} style={{ padding: '20px', background: 'rgba(245, 158, 11, 0.1)', borderLeft: `4px solid ${item.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b'}`, marginBottom: '16px', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <strong style={{ color: '#fff', fontSize: '1.1rem' }}>{item.company}</strong>
                          <span style={{ padding: '4px 12px', background: item.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b', color: '#fff', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>{item.type}</span>
                        </div>
                        <div style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: 1.5 }}>{item.detail}</div>
                      </div>
                    ))}

                    {/* CAPACITY */}
                    {activeAction === 'CAPACITY' && actionData && (
                      <div>
                        <div style={{ textAlign: 'center', marginBottom: '32px', padding: '24px', background: 'rgba(16,185,129,0.1)', borderRadius: '12px' }}>
                          <div style={{ fontSize: '4rem', color: '#10b981', fontWeight: 'bold' }}>{actionData.globalEfficiency}</div>
                          <div style={{ color: '#94a3b8', fontSize: '1.1rem', textTransform: 'uppercase' }}>Efficacité Réseau Globale</div>
                        </div>
                        <h3 style={{ color: '#ef4444', marginBottom: '12px', fontSize: '1rem' }}>Surcharges Détectées</h3>
                        {Array.isArray(actionData.overloadedHubs) && actionData.overloadedHubs.map((h: any, i: number) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', marginBottom: '8px', borderLeft: '4px solid #ef4444' }}>
                            <span style={{ color: '#fff', fontWeight: 'bold' }}>🔥 {h.name} <span style={{ color: '#ef4444' }}>({h.load})</span></span>
                            <span style={{ color: '#10b981', fontWeight: 'bold' }}>👉 {h.suggestedAction}</span>
                          </div>
                        ))}
                        <h3 style={{ color: '#3b82f6', marginBottom: '12px', marginTop: '24px', fontSize: '1rem' }}>Sous-Capacités Détectées</h3>
                        {Array.isArray(actionData.emptyHubs) && actionData.emptyHubs.map((h: any, i: number) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', marginBottom: '8px', borderLeft: '4px solid #3b82f6' }}>
                            <span style={{ color: '#fff', fontWeight: 'bold' }}>❄️ {h.name} <span style={{ color: '#3b82f6' }}>({h.load})</span></span>
                            <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>👉 {h.suggestedAction}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* TRUST */}
                    {activeAction === 'TRUST' && Array.isArray(actionData) && actionData.map((item: any, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: item.score > 90 ? '#10b981' : item.score > 50 ? '#f59e0b' : '#ef4444' }}>{item.score}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '4px' }}>{item.company}</div>
                          <div style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.4 }}>{item.history}</div>
                        </div>
                        <div className="badge" style={{ padding: '8px 16px', background: item.score > 90 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: item.score > 90 ? '#10b981' : '#ef4444', border: `1px solid ${item.score > 90 ? '#10b981' : '#ef4444'}` }}>
                          {item.status}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* SCREEN 2: CO2 & KPIs */}
          <div className="glass-card" style={{ padding: '24px', background: 'rgba(0,0,0,0.7)', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Empreinte Carbone Globale</h3>
            
            {/* Circular Gauge */}
            <div style={{ position: 'relative', width: '140px', height: '140px' }}>
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="60" fill="transparent" stroke="#1e293b" strokeWidth="12" />
                <circle cx="70" cy="70" r="60" fill="transparent" stroke="#10b981" strokeWidth="12" strokeDasharray="377" strokeDashoffset={377 - (377 * co2Value) / 100} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 2s ease-out', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>{co2Value}%</span>
                <span style={{ fontSize: '0.6rem', color: '#64748b' }}>RÉDUCTION</span>
              </div>
            </div>
            
            <div style={{ marginTop: '20px', width: '100%', display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>CO2 ÉVITÉ</div>
                <div style={{ color: '#10b981', fontWeight: 'bold' }}>42.5 Tonnes</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>ÉQUIVALENCE</div>
                <div style={{ color: '#3b82f6', fontWeight: 'bold' }}>210 Arbres</div>
              </div>
            </div>
          </div>

          {/* SCREEN 3: Alerts Log */}
          <div className="glass-card" style={{ padding: '20px', background: 'rgba(0,0,0,0.7)', border: '1px solid #1e293b', overflowY: 'auto' }}>
            <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', justifyContent: 'space-between' }}>
              <span>Flux d&apos;Alertes</span>
              <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>{MOCK_FRAUD.length} ACTIVES</span>
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {MOCK_FRAUD.map((item, i) => (
                <div key={i} style={{ padding: '12px', background: item.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', borderLeft: `3px solid ${item.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b'}`, borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <strong style={{ color: '#fff' }}>{item.company}</strong>
                    <span style={{ color: item.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b' }}>{item.type}</span>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', lineHeight: 1.4 }}>{item.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* The 5 Main Action Buttons Row */}
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px',
          padding: '16px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
          borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {[
            { id: 'SHORTAGES', icon: '⚠️', label: 'Menaces', color: '#ef4444' },
            { id: 'PREDICTIONS', icon: '📈', label: 'Prédictions', color: '#3b82f6' },
            { id: 'FRAUD', icon: '🛡️', label: 'Anti-Fraude', color: '#f59e0b' },
            { id: 'CAPACITY', icon: '🏭', label: 'Capacités', color: '#10b981' },
            { id: 'TRUST', icon: '🤝', label: 'Confiance', color: '#0ea5e9' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setActiveAction(btn.id as ActionType)}
              style={{
                display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '12px', background: activeAction === btn.id ? `${btn.color}33` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${activeAction === btn.id ? btn.color : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '12px', color: '#fff', cursor: 'pointer', transition: 'all 0.2s ease',
              }}
            >
              <div style={{ fontSize: '1.2rem' }}>{btn.icon}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{btn.label}</div>
            </button>
          ))}
        </div>

      </div>

      <style>{`
        .pulsing-dot { position: absolute; width: 4px; height: 4px; border-radius: 50%; animation: pulse-opacity 2s infinite alternate; }
        .animated-path { animation: dash 20s linear infinite; }
        @keyframes pulse-opacity { 0% { opacity: 0.4; transform: scale(1); } 100% { opacity: 1; transform: scale(1.5); } }
        @keyframes dash { to { stroke-dashoffset: -1000; } }
      `}</style>
    </div>
  );
}
