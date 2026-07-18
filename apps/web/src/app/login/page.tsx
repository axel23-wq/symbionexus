'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let finalEmail = email;
      let finalPassword = password;
      
      // Auto-complétion secrète pour faciliter la démonstration
      if (email === 'admin' && password === 'admin') {
        finalEmail = 'admin@symbionexus.com';
        finalPassword = 'Demo2024!';
      } else if (email === 'seller' && password === 'seller') {
        finalEmail = 'seller@cafvert.fr';
        finalPassword = 'Demo2024!';
      } else if (email === 'buyer' && password === 'buyer') {
        finalEmail = 'buyer@biocompost.fr';
        finalPassword = 'Demo2024!';
      }

      await login(finalEmail, finalPassword, rememberMe);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Email ou mot de passe incorrect');
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    { label: '📦 Vendeur', email: 'seller@cafvert.fr' },
    { label: '🛒 Acheteur', email: 'buyer@biocompost.fr' },
    { label: '🔑 Admin', email: 'admin@symbionexus.com' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
    }}>
      {/* Decorative glows */}
      <div style={{
        position: 'absolute', width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(13,148,136,0.15) 0%, transparent 70%)',
        top: '10%', left: '5%', filter: 'blur(60px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: '300px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)',
        bottom: '10%', right: '10%', filter: 'blur(40px)', pointerEvents: 'none',
      }} />

      <div className="neo-card" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '48px 40px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: 'var(--radius-md)',
            background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto 16px',
            boxShadow: 'var(--shadow-glow)',
          }}>🌿</div>
          <h1 style={{
            fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800,
            background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>SymbioNexus</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Connexion à votre espace
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#ef4444', fontSize: '0.85rem', marginBottom: '20px', textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label className="input-label" htmlFor="login-email">Email ou Identifiant</label>
            <input
              id="login-email"
              type="text"
              className="input-field"
              placeholder="contact@entreprise.fr ou admin"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {/* Password field with eye toggle */}
          <div style={{ marginBottom: '16px' }}>
            <label className="input-label" htmlFor="login-password">Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  fontSize: '1.2rem',
                  color: 'var(--color-text-muted)',
                  transition: 'color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Remember Me checkbox */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '28px',
          }}>
            <label
              htmlFor="remember-me"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                color: 'var(--color-text-secondary)',
                userSelect: 'none',
              }}
            >
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: 'var(--color-primary, #0d9488)',
                  cursor: 'pointer',
                }}
              />
              Se souvenir de moi (30 jours)
            </label>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
          >
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                Connexion...
              </span>
            ) : (
              '🔐 Se connecter'
            )}
          </button>
        </form>

        <div style={{
          textAlign: 'center', marginTop: '24px',
          fontSize: '0.9rem', color: 'var(--color-text-secondary)',
        }}>
          Pas encore de compte ?{' '}
          <Link href="/register" style={{ fontWeight: 600 }}>
            Créer un compte
          </Link>
        </div>

        {/* Demo accounts */}
        <div style={{
          marginTop: '32px', paddingTop: '24px',
          borderTop: '1px solid var(--border-subtle)',
        }}>
          <p style={{
            fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em',
            color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: '12px', textAlign: 'center',
          }}>
            Comptes de démonstration
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {demoAccounts.map((acc, i) => (
              <button
                key={i}
                type="button"
                className="btn-ghost"
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                onClick={() => {
                  setEmail(acc.email);
                  setPassword('Demo2024!');
                }}
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
