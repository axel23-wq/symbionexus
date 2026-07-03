'use client';

import { useEffect, useState } from 'react';

// Bouton d'installation PWA adaptatif :
//  • Android / Chrome / Edge  -> installation en 1 clic (beforeinstallprompt)
//  • iPhone / iPad (Safari)   -> Apple interdit l'install auto : on affiche
//    les instructions "Partager → Sur l'écran d'accueil".
// Se cache automatiquement si l'app est déjà installée (mode standalone).
export default function InstallPWAButton() {
  const [deferred, setDeferred] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Defer client feature-detection one frame so setState isn't synchronous
    // inside the effect (avoids React cascading-render warning).
    const raf = requestAnimationFrame(() => {
      const ua = window.navigator.userAgent || '';
      const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
      setIsIOS(iOS);

      const standalone =
        window.matchMedia?.('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      if (standalone) setHidden(true);
    });

    const onPrompt = (e: any) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => { setDeferred(null); setHidden(true); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // Rien à montrer : déjà installée, ou (non-iOS et pas encore installable)
  if (hidden) return null;
  if (!isIOS && !deferred) return null;

  const installAndroid = async () => {
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch {}
    setDeferred(null);
  };

  const btnStyle: React.CSSProperties = {
    position: 'fixed', bottom: 24, right: 24, zIndex: 900,
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '13px 20px', borderRadius: 14, border: 'none',
    background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(16,185,129,0.4)',
  };

  // ── iPhone / iPad : bouton + carte d'instructions ──
  if (isIOS) {
    return (
      <>
        <button style={btnStyle} onClick={() => setShowIOSHelp((v) => !v)} title="Installer sur iPhone">
          📲 Installer l&apos;app
        </button>
        {showIOSHelp && (
          <div
            style={{
              position: 'fixed', bottom: 84, right: 24, zIndex: 901, width: 280,
              background: '#0f1729', border: '1.5px solid #1a2540', borderRadius: 16,
              padding: 18, boxShadow: '0 12px 40px rgba(0,0,0,0.5)', color: '#e2e8f0',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span>📲 Installer sur iPhone</span>
              <span style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => setShowIOSHelp(false)}>✕</span>
            </div>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#94a3b8', lineHeight: 1.7 }}>
              <li>Appuie sur <strong style={{ color: '#34d399' }}>Partager</strong> <span style={{ fontSize: 15 }}>􀈂</span> (en bas de Safari)</li>
              <li>Choisis <strong style={{ color: '#34d399' }}>« Sur l&apos;écran d&apos;accueil »</strong></li>
              <li>Appuie sur <strong style={{ color: '#34d399' }}>Ajouter</strong></li>
            </ol>
            <p style={{ fontSize: 11, color: '#475569', marginTop: 10 }}>
              L&apos;icône SymbioNexus apparaîtra sur ton écran d&apos;accueil.
            </p>
          </div>
        )}
      </>
    );
  }

  // ── Android / Desktop : installation en 1 clic ──
  return (
    <button style={btnStyle} onClick={installAndroid} title="Installer SymbioNexus">
      📲 Installer l&apos;app
    </button>
  );
}
