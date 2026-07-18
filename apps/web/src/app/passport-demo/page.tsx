'use client';

import React from 'react';

export default function PassportDemoPage() {
  const mockQR = {
    id: 'TRP-10493',
    match: { listing: { title: 'Granulés PET recyclés' } },
    volumeKg: 12000,
    driver: { name: 'Jean Dupont' },
    status: 'LIVRÉ'
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'radial-gradient(circle at 50% 50%, #1e293b, #0f172a)' }}>
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
      `}} />

      <div className="passport-card">
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
                <div className="pp-value">{mockQR.id}</div>
              </div>
            </div>
            <div className="pp-box">
              <div className="pp-icon">♻️</div>
              <div className="pp-content">
                <div className="pp-label">Matériau</div>
                <div className="pp-value">{mockQR.match.listing.title}</div>
              </div>
            </div>
          </div>
          
          <div style={{ position: 'relative' }}>
            <div className="pp-co2">
              <p className="pp-co2-text">-{((mockQR.volumeKg) * 0.05).toFixed(0)} kg CO₂ évités</p>
            </div>
          </div>
          
          <div className="pp-col">
            <div className="pp-box">
              <div className="pp-icon">⚖️</div>
              <div className="pp-content">
                <div className="pp-label">Volume</div>
                <div className="pp-value">{(mockQR.volumeKg).toLocaleString('fr-FR')} kg</div>
              </div>
            </div>
            <div className="pp-box">
              <div className="pp-icon">👤</div>
              <div className="pp-content">
                <div className="pp-label">Chauffeur</div>
                <div className="pp-value">{mockQR.driver.name}</div>
              </div>
            </div>
            <div className="pp-box">
              <div className="pp-icon">✅</div>
              <div className="pp-content">
                <div className="pp-label">Statut Actuel</div>
                <div className="pp-value">Livré</div>
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
  );
}
