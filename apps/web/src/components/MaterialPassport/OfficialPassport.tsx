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
      <div className={styles.actions}>
        <button className={styles.btnPrimary} onClick={() => window.print()}>
          🖨️ Imprimer le Passeport
        </button>
        <button className={styles.btnSecondary} onClick={() => navigator.clipboard.writeText(qrValue)}>
          📋 Copier l'ID Blockchain
        </button>
        <button className={styles.btnSecondary} onClick={() => alert(`Passeport ${selectedPassport.id} téléchargé (simulation)`)}>
          📥 Télécharger PDF
        </button>
      </div>
    </div>
  );
}
