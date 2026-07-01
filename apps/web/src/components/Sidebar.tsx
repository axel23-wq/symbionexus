'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

interface NavItem {
  icon: string;
  label: string;
  href: string;
  badge?: number;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { icon: '📊', label: 'Tableau de bord', href: '/dashboard' },
  { icon: '🏪', label: 'Marketplace', href: '/marketplace' },
  { icon: '📋', label: 'Mes annonces', href: '/listings', roles: ['SELLER'] },
  { icon: '🤖', label: 'Matchmaking IA', href: '/matches' },
  { icon: '📝', label: 'Contrats', href: '/contracts' },
  { icon: '📦', label: 'Passeports', href: '/passports' },
  { icon: '🌱', label: 'Crédits Carbone', href: '/carbon' },
  { icon: '💬', label: 'Messages', href: '/messages' },
];

const ADMIN_ITEMS: NavItem[] = [
  { icon: '⚡', label: 'Admin — Vue globale', href: '/admin' },
  { icon: '✅', label: 'Validation comptes', href: '/admin/accounts' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

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
        <div className="nav-section-title">Navigation</div>
        {filteredItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${pathname === item.href || pathname.startsWith(item.href + '/') ? 'active' : ''}`}
          >
            <span className="nav-item-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && item.badge > 0 && (
              <span className="nav-item-badge">{item.badge}</span>
            )}
          </Link>
        ))}
      </nav>

      {/* Admin section */}
      {user.role === 'ADMIN' && (
        <nav className="nav-section">
          <div className="nav-section-title">Administration</div>
          {ADMIN_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      )}

      {/* User profile card at bottom */}
      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
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
