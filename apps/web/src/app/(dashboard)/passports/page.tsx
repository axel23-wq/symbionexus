'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function LogisticsPage() {
  const [transports, setTransports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransport, setSelectedTransport] = useState<any | null>(null);

  const MOCK_TRANSPORTS = [
    {
      id: 'TRP-10492',
      status: 'NEAR_DESTINATION',
      truckPlate: 'CE-452-AB',
      driverName: 'Samuel Ebo',
      volumeKg: 4500,
      material: 'Aluminium Industriel',
      progressPercent: 85,
      currentLocation: { lat: 4.0511, lng: 9.7679 }, // Near Douala
      departure: 'Usine Alucam, Edéa',
      destination: 'Port de Douala',
      eta: '14:30',
      co2Saved: '-120 kg CO₂',
      alerts: []
    },
    {
      id: 'TRP-10493',
      status: 'EN_ROUTE',
      truckPlate: 'LT-982-XY',
      driverName: 'Jean Dupont',
      volumeKg: 1200,
      material: 'Plastique PET',
      progressPercent: 42,
      currentLocation: { lat: 3.8480, lng: 11.5021 }, // Yaoundé
      departure: 'Centre de tri Nkolbisson',
      destination: 'Recyclage Mvan',
      eta: '16:45',
      co2Saved: '-45 kg CO₂',
      alerts: ['Trafic ralenti sur N3']
    }
  ];

  const fetchTransports = async () => {
    try {
      const result = await api.getLogisticsTransports().catch(() => []);
      const data = result && result.length > 0 ? result : MOCK_TRANSPORTS;
      setTransports(data);
      if (!selectedTransport && data.length > 0) {
        setSelectedTransport(data[0]);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setTransports(MOCK_TRANSPORTS);
      if (!selectedTransport) setSelectedTransport(MOCK_TRANSPORTS[0]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransports();
    // Simulate real-time polling every 5s
    const interval = setInterval(fetchTransports, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '80vh', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 40px)', gap: '24px', padding: '24px', boxSizing: 'border-box' }}>
      
      {/* LEFT SIDEBAR: Transport List */}
      <div style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--color-text)' }}>Logistique & GPS</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Suivi en direct des convois de matériaux
          </p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {transports.map((t) => (
            <div 
              key={t.id}
              onClick={() => setSelectedTransport(t)}
              style={{
                background: selectedTransport?.id === t.id ? 'var(--color-primary-dark)' : 'var(--color-bg-glass-light)',
                border: `1px solid ${selectedTransport?.id === t.id ? 'var(--color-primary)' : 'var(--border-subtle)'}`,
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{t.id}</span>
                <span className="badge" style={{ 
                  background: t.status === 'NEAR_DESTINATION' ? 'var(--color-success-dim)' : 'var(--color-primary-dim)',
                  color: t.status === 'NEAR_DESTINATION' ? 'var(--color-success)' : 'var(--color-primary)'
                }}>
                  {t.status === 'NEAR_DESTINATION' ? 'En Approche' : 'En Transit'}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                🚚 {t.truckPlate} • {t.driverName}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                📦 {t.volumeKg.toLocaleString()} kg de {t.material}
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '4px', background: 'var(--color-bg-glass)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${t.progressPercent}%`, 
                  height: '100%', 
                  background: t.status === 'NEAR_DESTINATION' ? 'var(--color-success)' : 'var(--color-primary)',
                  transition: 'width 1s ease-in-out'
                }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE: Map & Details */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* MAP CONTAINER (Simulated UI) */}
        <div style={{ 
          flex: 1, 
          background: '#0f172a', // Dark map background
          borderRadius: 'var(--radius-lg)', 
          border: '1px solid var(--border-subtle)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)'
        }}>
          {/* Map Grid Pattern */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
          
          {selectedTransport ? (
            <div style={{ textAlign: 'center', zIndex: 10, animation: 'fadeIn 0.5s ease' }}>
              <div style={{ 
                width: '60px', height: '60px', borderRadius: '50%', 
                background: 'rgba(59, 130, 246, 0.2)', 
                border: '2px solid #3b82f6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px auto',
                boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)',
                position: 'relative'
              }}>
                <span style={{ fontSize: '1.5rem' }}>🚛</span>
                {/* Ping animation */}
                <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: '1px solid #3b82f6', animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }}></div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '12px 24px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                <span style={{ color: '#fff', fontWeight: 600 }}>Cible : {selectedTransport.currentLocation.lat.toFixed(4)}, {selectedTransport.currentLocation.lng.toFixed(4)}</span>
                <span style={{ margin: '0 12px', color: '#64748b' }}>|</span>
                <span style={{ color: '#3b82f6' }}>Vitesse : 75 km/h</span>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--color-text-muted)' }}>Sélectionnez un transport</div>
          )}
          
          {/* Decorative radar sweep */}
          <div style={{ position: 'absolute', width: '200vw', height: '200vw', background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(59,130,246,0.1) 360deg)', borderRadius: '50%', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animation: 'spin 4s linear infinite', pointerEvents: 'none' }}></div>
        </div>

        {/* BOTTOM HUD: Transport Details */}
        {selectedTransport && (
          <div style={{ 
            height: '200px', 
            background: 'var(--color-bg-glass)', 
            borderRadius: 'var(--radius-lg)', 
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '24px',
            animation: 'slideUp 0.3s ease'
          }}>
            {/* Route Info */}
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Itinéraire</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-text-muted)' }}></div>
                <div style={{ color: 'var(--color-text)' }}>{selectedTransport.departure}</div>
              </div>
              <div style={{ marginLeft: '5px', height: '24px', borderLeft: '2px dashed var(--border-subtle)', marginBottom: '12px' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-primary)', boxShadow: '0 0 10px var(--color-primary)' }}></div>
                <div style={{ color: 'var(--color-text)', fontWeight: 600 }}>{selectedTransport.destination}</div>
              </div>
            </div>

            {/* Metrics */}
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Télémétrie</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Progression</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{selectedTransport.progressPercent}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Heure d'arrivée (ETA)</span>
                <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{selectedTransport.eta}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Poids total</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{selectedTransport.volumeKg.toLocaleString()} kg</span>
              </div>
            </div>

            {/* Impact & Alerts */}
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Impact & Statut</h3>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.5rem' }}>🌱</span>
                <div>
                  <div style={{ color: 'var(--color-success)', fontWeight: 600 }}>{selectedTransport.co2Saved}</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>CO₂ Optimisé en route</div>
                </div>
              </div>
              
              {selectedTransport.alerts.length > 0 && (
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '8px 12px', borderRadius: '8px', color: '#f59e0b', fontSize: '0.85rem' }}>
                  ⚠️ {selectedTransport.alerts[0]}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        @keyframes spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
