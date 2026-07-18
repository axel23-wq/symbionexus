'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import InstallPWAButton from '@/components/InstallPWAButton';
import AIPanel from '@/components/AIPanel/AIPanel';
import { LanguageProvider } from '@/lib/i18n/LanguageProvider';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import { QueryProvider } from '@/lib/QueryProvider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--color-text-secondary)' }}>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <ThemeProvider>
      <LanguageProvider>
        <QueryProvider>
          <div>
            <Sidebar />
            <main className="main-content">
              {children}
            </main>
            <InstallPWAButton />
            <AIPanel />
          </div>
        </QueryProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
