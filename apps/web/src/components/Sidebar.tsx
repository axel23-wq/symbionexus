'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n/LanguageProvider';

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
  { icon: '🏪', tkey: 'nav.marketplace', href: '/marketplace' },
  { icon: '♻️', tkey: 'nav.citizen', href: '/citizen' },
  { icon: '🛰️', tkey: 'nav.controlRoom', href: '/control-room' },
  { icon: '📋', tkey: 'nav.listings', href: '/listings', roles: ['SELLER'] },
  { icon: '🤖', tkey: 'nav.matches', href: '/matches' },
  { icon: '📝', tkey: 'nav.contracts', href: '/contracts' },
  { icon: '📦', tkey: 'nav.passports', href: '/passports' },
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

  const filteredItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user.role)
  );

  return (
    <aside className="sidebar">
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

      {/* Admin section */}
      {user.role === 'ADMIN' && (
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

      {/* User profile card at bottom */}
      <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-bg-glass-light)',
        }}>
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
          <button
            onClick={logout}
            className="btn-ghost"
            style={{ padding: '4px 8px', fontSize: '1rem' }}
            title="Déconnexion"
          >
            🚪
          </button>
        </div>
      </div>
    </aside>
  );
}
