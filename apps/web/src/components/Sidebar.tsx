'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import UserProfileMenu from './UserProfileMenu';

interface NavItem {
  icon: string;
  tkey?: string;
  label?: string;
  href: string;
  badge?: number;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { icon: '📊', tkey: 'nav.dashboard', href: '/dashboard' },
  { icon: '🌍', tkey: 'nav.directory', label: 'Annuaire National', href: '/directory' },
  { icon: '🏪', tkey: 'nav.marketplace', href: '/marketplace' },
  { icon: '♻️', tkey: 'nav.citizen', href: '/citizen' },
  { icon: '🛰️', tkey: 'nav.controlRoom', href: '/control-room' },
  { icon: '📋', tkey: 'nav.listings', href: '/listings', roles: ['SELLER'] },
  { icon: '🤖', tkey: 'nav.matches', href: '/matches' },
  { icon: '📝', tkey: 'nav.contracts', href: '/contracts' },
  { icon: '📦', tkey: 'nav.passports', href: '/passports' },
  { icon: '📜', label: 'Passeport Officiel', href: '/official-passport' },
  { icon: '🌱', tkey: 'nav.carbon', href: '/carbon' },
  { icon: '💬', tkey: 'nav.messages', href: '/messages' },
];

const ADMIN_ITEMS: NavItem[] = [
  { icon: '⚡', tkey: 'nav.admin', href: '/admin' },
  { icon: '✅', tkey: 'nav.adminAccounts', href: '/admin/accounts' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  if (!user) return null;

  // Afficher toutes les fonctionnalités pour la démonstration (désactivation des filtres par rôle)
  const filteredItems = NAV_ITEMS;

  return (
    <aside className="sidebar border-2 border-[#00ff99] shadow-[0_0_20px_rgba(0,255,153,1),0_0_40px_rgba(0,255,153,0.8),0_0_60px_rgba(0,255,153,0.6),inset_0_0_15px_rgba(0,255,153,0.8)] rounded-2xl">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🌿</div>
        <div>
          <div className="sidebar-logo-text">SymbioNexus</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Économie Circulaire
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="nav-section">
        <div className="nav-section-title">{t('nav.sectionMain')}</div>
        {filteredItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${pathname === item.href || pathname.startsWith(item.href + '/') ? 'active' : ''}`}
          >
            <span className="nav-item-icon">{item.icon}</span>
            <span>{item.tkey ? t(item.tkey) : item.label}</span>
            {item.badge && item.badge > 0 && (
              <span className="nav-item-badge">{item.badge}</span>
            )}
          </Link>
        ))}
      </nav>

      {/* Admin section - Toujours visible pour la démo */}
      {true && (
        <nav className="nav-section">
          <div className="nav-section-title">{t('nav.sectionAdmin')}</div>
          {ADMIN_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span>{item.tkey ? t(item.tkey) : item.label}</span>
            </Link>
          ))}
        </nav>
      )}

      {/* Paramètres — juste au-dessus du bloc profil */}
      <div style={{ marginTop: 'auto' }}>
        <Link
          href="/settings"
          className={`nav-item ${pathname === '/settings' || pathname.startsWith('/settings/') ? 'active' : ''}`}
        >
          <span className="nav-item-icon">⚙️</span>
          <span>{t('nav.settings')}</span>
        </Link>
      </div>

      {/* User profile Menu (Popover) */}
      <hr className="border-t-2 border-[#00ff99] my-4 shadow-[0_0_15px_#00ff99,0_0_30px_#00ff99,0_0_45px_#00ff99]" />
      <UserProfileMenu />
    </aside>
  );
}
