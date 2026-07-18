'use client';

import { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import styles from './OfficialPassport.module.css';

interface PassportData {
  id: string;
  conveyanceId: string;
  material: string;
  volume: number;
  driver: string;
  status: string;
  carbonSaved: number;
  blockchainHash: string;
  generatedDate: string;
  company: string;
}

// Données de démonstration
const DEMO_PASSPORT: PassportData = {
  id: 'PSP-2026-07-16-001',
  conveyanceId: 'TRP-10493',
  material: 'Granulés PET recyclés',
  volume: 12000,
  driver: 'Jean Dupont',
  status: 'Livré',
  carbonSaved: 600,
  blockchainHash: '0x8f7c9a3b2e1...3a9c',
  generatedDate: '16 juillet 2026',
  company: 'SymbioNexus AI OS'
};

export default function OfficialPassport() {
  const [selectedPassport, setSelectedPassport] = useState<PassportData>(DEMO_PASSPORT);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [showBlockchainModal, setShowBlockchainModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyBlockchain = () => {
    navigator.clipboard.writeText(selectedPassport.blockchainHash);
    setCopied(true);
    setShowBlockchainModal(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadPdf = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      window.print();
    }, 1500);
  };

  const qrValue = JSON.stringify({
    id: selectedPassport.id,
    conveyanceId: selectedPassport.conveyanceId,
    hash: selectedPassport.blockchainHash,
    date: selectedPassport.generatedDate,
  });

  // Generate QR code on mount and update
  useEffect(() => {
    if (qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, qrValue, {
        width: 120,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      }).catch(console.error);
    }
  }, [qrValue]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>📜 Passeport Officiel de Traçabilité</h1>
        <p className={styles.subtitle}>Document Officiel B2B Certifié SymbioNexus</p>
      </div>

      <div className={styles.passportCard}>
        {/* Header avec logo */}
        <div className={styles.passportHeader}>
          <div className={styles.logoSection}>
            <div className={styles.logo}>🌿</div>
            <div>
              <h2>PASSEPORT SYMBIONEXUS</h2>
              <p>DOCUMENT OFFICIEL DE TRAÇABILITÉ B2B</p>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className={styles.content}>
          {/* Grille gauche - Informations */}
          <div className={styles.infoGrid}>
            <div className={styles.infoBox}>
              <div className={styles.infoLabel}>IDENTIFIANT CONVOI</div>
              <div className={styles.infoValue}>{selectedPassport.conveyanceId}</div>
            </div>

            <div className={styles.infoBox}>
              <div className={styles.infoLabel}>MATÉRIAU</div>
              <div className={styles.infoValue}>{selectedPassport.material}</div>
            </div>

            <div className={styles.infoBox}>
              <div className={styles.infoLabel}>VOLUME</div>
              <div className={styles.infoValue}>{selectedPassport.volume.toLocaleString()} kg</div>
            </div>
          </div>

          {/* Centre - Affichage carbone */}
          <div className={styles.carbonDisplay}>
            <div className={styles.carbonValue}>
              -{selectedPassport.carbonSaved.toLocaleString()} kg CO₂
            </div>
            <div className={styles.carbonLabel}>évités</div>
          </div>

          {/* Grille droite - Infos supplémentaires */}
          <div className={styles.infoGrid}>
            <div className={styles.infoBox}>
              <div className={styles.infoLabel}>VOLUME</div>
              <div className={styles.infoValue}>{selectedPassport.volume.toLocaleString()} kg</div>
            </div>

            <div className={styles.infoBox}>
              <div className={styles.infoLabel}>CHAUFFEUR</div>
              <div className={styles.infoValue}>{selectedPassport.driver}</div>
            </div>

            <div className={styles.infoBox}>
              <div className={styles.infoLabel}>STATUT ACTUEL</div>
              <div className={styles.infoValue} style={{ color: '#00ff99' }}>
                ✓ {selectedPassport.status}
              </div>
            </div>
          </div>
        </div>

        {/* Section de vérification blockchain */}
        <div className={styles.verificationSection}>
          <div className={styles.verificationContent}>
            <div className={styles.verificationText}>
              <div className={styles.verificationTitle}>VÉRIFICATION B2B CRYPTOGRAPHIQUE</div>
              <div className={styles.hashDisplay}>
                Hash Blockchain: <code>{selectedPassport.blockchainHash}</code>
              </div>
              <div className={styles.verifiedBadge}>
                ✓ EMPREINTE CRYPTOGRAPHIQUE VÉRIFIÉE
              </div>
            </div>
            <div className={styles.qrCodeContainer}>
              <canvas ref={qrCanvasRef} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <p>Généré le {selectedPassport.generatedDate} par {selectedPassport.company} AI OS</p>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className={styles.btnPrimary} onClick={() => window.print()}>
          🖨️ Imprimer
        </button>
        <button 
          className={styles.btnSecondary} 
          onClick={handleCopyBlockchain}
          style={{ position: 'relative', overflow: 'hidden' }}
        >
          {copied ? '✅ ID Copié avec succès' : '📋 Copier l\'ID Blockchain'}
        </button>
        <button 
          className={styles.btnSecondary} 
          onClick={handleDownloadPdf}
          disabled={downloading}
          style={{ opacity: downloading ? 0.7 : 1 }}
        >
          {downloading ? '⏳ Génération du PDF...' : '📥 Télécharger PDF'}
        </button>
      </div>

      {/* Explorer Blockchain Modal Premium */}
      {showBlockchainModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 12000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(4, 8, 16, 0.85)', backdropFilter: 'blur(10px)' }}>
          <div style={{ background: '#0a0f1e', border: '1.5px solid #2dd4bf', borderRadius: 24, padding: 32, width: '100%', maxWidth: 520, boxShadow: '0 30px 80px rgba(45, 212, 191, 0.25)' }}>
            <h3 style={{ fontSize: 22, color: '#2dd4bf', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800 }}>
              <span>⛓️</span> SymbioNexus Explorer
            </h3>
            <div style={{ background: '#020617', padding: 20, borderRadius: 16, marginBottom: 24, fontFamily: 'monospace', color: '#94a3b8', fontSize: 13, wordBreak: 'break-all', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: '#fff', marginBottom: 8, fontWeight: 'bold' }}>Transaction Hash copiée :</div>
              <div style={{ color: '#2dd4bf' }}>{selectedPassport.blockchainHash}</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 30, background: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: '#64748b' }}>Statut du réseau</span>
                <span style={{ color: '#10b981', fontWeight: 800 }}>● En ligne (Immuable)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: '#64748b' }}>Contrat Intelligent</span>
                <span style={{ color: '#e2e8f0', fontWeight: 600 }}>SymbioNexus Core V1</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: '#64748b' }}>Horodatage Certifié</span>
                <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{new Date().toLocaleString('fr-FR')}</span>
              </div>
            </div>

            <button onClick={() => setShowBlockchainModal(false)} style={{ width: '100%', padding: '14px', background: '#2dd4bf', color: '#000', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>
              Fermer l'explorateur
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
