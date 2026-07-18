'use client';

import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';

export default function ExpoGoButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [expoUrl, setExpoUrl] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  // Éviter les erreurs d'hydratation (SSR vs Client)
  useEffect(() => {
    setIsMounted(true);
    // Tenter de deviner l'IP si on n'est pas sur localhost
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host !== 'localhost' && host !== '127.0.0.1') {
        setExpoUrl(`exp://${host}:8081`);
      } else {
        setExpoUrl('exp://192.168.X.X:8081');
      }
    }
  }, []);

  if (!isMounted) return null;

  const btnStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 24,
    left: 24,
    zIndex: 9000, // Z-index élevé pour être sûr qu'il est cliquable
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '13px 20px',
    borderRadius: 14,
    border: '1.5px solid #1a2540',
    background: '#0f1729',
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
    transition: 'all 0.2s',
  };

  const isUrlValid = expoUrl.startsWith('exp://');

  return (
    <>
      <button 
        style={btnStyle} 
        onClick={() => setIsOpen(true)} 
        title="Ouvrir dans Expo Go"
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#3b82f6';
          e.currentTarget.style.color = '#3b82f6';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#1a2540';
          e.currentTarget.style.color = '#cbd5e1';
        }}
      >
        <span>📱</span> Expo Go
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(4,8,16,0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
        }}>
          <div style={{
            background: '#0f1729', border: '1.5px solid #1a2540', borderRadius: 20,
            padding: 32, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            position: 'relative', textAlign: 'center'
          }}>
            <button 
              onClick={() => setIsOpen(false)}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: '#111c30', border: '1.5px solid #1a2540', borderRadius: 10,
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#94a3b8', cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#111c30'; e.currentTarget.style.color = '#94a3b8'; }}
            >
              ✕
            </button>
            
            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 12 }}>
              📱 Tester sur Mobile
            </h3>
            <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
              Ouvrez l&apos;application <strong>Expo Go</strong> sur votre téléphone et scannez ce QR Code.
            </p>

            <div style={{ 
              background: '#fff', padding: 20, borderRadius: 16, display: 'inline-block', marginBottom: 20,
              boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.2)'
            }}>
              {isUrlValid ? (
                <QRCode value={expoUrl} size={220} />
              ) : (
                <div style={{ width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', textAlign: 'center', fontWeight: 'bold' }}>
                  URL INVALIDE.<br/>Doit commencer par exp://
                </div>
              )}
            </div>

            <div style={{ textAlign: 'left', background: '#111c30', padding: 16, borderRadius: 12, border: '1px solid #1e293b' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>
                <span>URL Expo (exp://)</span>
                {!isUrlValid && <span style={{ color: '#ef4444' }}>Invalide</span>}
              </label>
              <input 
                type="text" 
                value={expoUrl}
                onChange={(e) => setExpoUrl(e.target.value.trim())}
                placeholder="exp://192.168..."
                style={{
                  width: '100%', padding: '12px 16px', background: '#0b1120', border: `1.5px solid ${isUrlValid ? '#3b82f6' : '#ef4444'}`,
                  borderRadius: 8, color: '#f1f5f9', fontSize: 15, outline: 'none', transition: 'border-color 0.2s',
                  fontFamily: 'monospace'
                }}
              />
              <p style={{ fontSize: 13, color: '#fbbf24', marginTop: 12, fontWeight: 600, lineHeight: 1.4 }}>
                ⚠️ OBLIGATOIRE : Remplacez par l&apos;URL exacte affichée dans votre terminal après avoir lancé `npm run dev:mobile`.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
