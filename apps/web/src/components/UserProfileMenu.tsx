'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useTranslation } from '@/lib/i18n/LanguageProvider';

export default function UserProfileMenu() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { t, locale, setLocale } = useTranslation();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowLogoutConfirm(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div ref={menuRef} style={{ position: 'relative', width: '100%' }}>
      {/* Bouton profil qui déclenche le menu */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          borderRadius: 'var(--radius-md)',
          background: isOpen ? 'var(--color-bg-glass-heavy)' : 'var(--color-bg-glass-light)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          border: isOpen ? '1px solid rgba(0,255,153,0.4)' : '1px solid transparent',
        }}
      >
        <div className="user-avatar" style={{ width: '36px', height: '36px', fontSize: '0.8rem' }}>
          {user.firstName[0]}{user.lastName[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.85rem', fontWeight: 600,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {user.firstName} {user.lastName}
          </div>
          <div style={{
            fontSize: '0.7rem', color: 'var(--color-text-muted)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {user.company?.name}
          </div>
        </div>
        <div style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', fontSize: '0.8rem' }}>
          🔼
        </div>
      </div>

      {/* Popover Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 12px)',
          left: 0,
          right: 0,
          background: 'rgba(15, 23, 41, 0.98)',
          backdropFilter: 'blur(20px)',
          border: '1.5px solid #1a2540',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '0 -10px 40px rgba(0,255,153,0.15)',
          zIndex: 50,
          animation: 'slideUp 0.2s ease-out forwards',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Section 1: Profil et Entreprise */}
          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '8px', letterSpacing: '0.05em' }}>
              👤 Profil & Entreprise
            </div>
            <Link href="/settings?tab=profile" onClick={() => setIsOpen(false)} style={{ textDecoration: 'none' }}>
              <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', color: '#e2e8f0', fontSize: '0.85rem', marginBottom: '6px', transition: 'background 0.2s' }} className="menu-item-hover">
                Mon Profil Personnel
              </div>
            </Link>
            <Link href="/settings?tab=profile" onClick={() => setIsOpen(false)} style={{ textDecoration: 'none' }}>
              <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', color: '#e2e8f0', fontSize: '0.85rem', transition: 'background 0.2s' }} className="menu-item-hover">
                Paramètres de l'Entreprise
              </div>
            </Link>
          </div>

          <hr style={{ borderColor: '#1a2540', margin: 0 }} />

          {/* Section 2: Facturation & Abonnements */}
          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '8px', letterSpacing: '0.05em' }}>
              💳 Facturation & Abonnements
            </div>
            <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.1))', border: '1px solid rgba(16,185,129,0.3)', padding: '12px', borderRadius: '10px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#34d399' }}>Plan Pro Premium</span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>Actif</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Crédits Matchmaking</span>
                <span>45/50</span>
              </div>
              <div style={{ height: '4px', background: '#1e293b', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '90%', background: '#10b981', borderRadius: '2px' }} />
              </div>
            </div>
            
            <a 
              href="https://wa.me/237696567184?text=Bonjour,%20je%20souhaite%20avoir%20des%20informations%20sur%20la%20facturation%20et%20les%20abonnements%20SymbioNexus"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <button style={{ width: '100%', background: '#25D366', color: 'white', border: 'none', padding: '8px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
                Contacter le service commercial
              </button>
            </a>
            <div style={{ textAlign: 'center', fontSize: '0.65rem', color: '#94a3b8', marginTop: '6px' }}>+237 696 567 184</div>
          </div>

          <hr style={{ borderColor: '#1a2540', margin: 0 }} />

          {/* Section 3: Préférences et Sécurité */}
          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '8px', letterSpacing: '0.05em' }}>
              ⚙️ Préférences et Sécurité
            </div>
            
            <Link href="/settings?tab=security" onClick={() => setIsOpen(false)} style={{ textDecoration: 'none' }}>
              <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', color: '#e2e8f0', fontSize: '0.85rem', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="menu-item-hover">
                <span>Sécurité & 2FA</span>
                <span style={{ fontSize: '0.65rem', background: 'rgba(239,68,68,0.2)', color: '#ef4444', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Désactivé</span>
              </div>
            </Link>

            <div style={{ display: 'flex', gap: '8px' }}>
              {/* Thème Toggle */}
              <div 
                style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }} 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="menu-item-hover"
              >
                <span style={{ fontSize: '1rem' }}>{theme === 'dark' ? '🌙' : '☀️'}</span>
                <span style={{ fontSize: '0.75rem', color: '#e2e8f0' }}>{theme === 'dark' ? 'Sombre' : 'Clair'}</span>
              </div>
              {/* Langue Toggle */}
              <div 
                style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }} 
                onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
                className="menu-item-hover"
              >
                <span style={{ fontSize: '1rem' }}>🌍</span>
                <span style={{ fontSize: '0.75rem', color: '#e2e8f0', textTransform: 'uppercase' }}>{locale}</span>
              </div>
            </div>
          </div>

          <hr style={{ borderColor: '#1a2540', margin: 0 }} />

          {/* Section 4: Déconnexion */}
          <div>
            {!showLogoutConfirm ? (
              <button 
                onClick={() => setShowLogoutConfirm(true)}
                style={{ width: '100%', background: 'transparent', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                className="btn-logout-hover"
              >
                🚪 Se déconnecter
              </button>
            ) : (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '0.8rem', color: '#e2e8f0', marginBottom: '10px', textAlign: 'center', fontWeight: 500 }}>
                  Êtes-vous sûr de vouloir vous déconnecter ?
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setShowLogoutConfirm(false)} style={{ flex: 1, background: '#1e293b', color: 'white', border: '1px solid #334155', padding: '6px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                    Annuler
                  </button>
                  <button onClick={handleLogout} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', padding: '6px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                    Confirmer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .menu-item-hover:hover {
          background: rgba(255,255,255,0.08) !important;
        }
        .btn-logout-hover:hover {
          background: rgba(239,68,68,0.1) !important;
          border-color: rgba(239,68,68,0.6) !important;
        }
      `}</style>
    </div>
  );
}
