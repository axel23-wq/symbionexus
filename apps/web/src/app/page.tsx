'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

const STATS = [
  { value: '4.2K+', label: 'Tonnes CO₂ évitées', icon: '🌱' },
  { value: '320+', label: 'Entreprises connectées', icon: '🏭' },
  { value: '1,200+', label: 'Transactions réalisées', icon: '🔄' },
  { value: '1,5 Md FCFA', label: 'Valeur échangée', icon: '💰' },
];

const FEATURES = [
  {
    icon: '🤖',
    title: 'Matchmaking IA',
    description: 'Notre algorithme analyse compatibilité matérielle, proximité géographique et fiabilité pour vous proposer les meilleurs partenaires automatiquement.',
    gradient: 'from-teal-500 to-emerald-500',
  },
  {
    icon: '📦',
    title: 'Passeport Numérique',
    description: 'Chaque lot reçoit un QR code unique avec suivi GPS en temps réel. Traçabilité totale de l\'usine émettrice à l\'usine receveuse.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: '🌍',
    title: 'Crédits Carbone',
    description: 'Chaque livraison confirmée génère automatiquement un certificat de CO₂ évité, calculé selon les facteurs d\'émission ADEME.',
    gradient: 'from-emerald-500 to-green-500',
  },
  {
    icon: '📊',
    title: 'Tableau de Bord',
    description: 'Pilotez vos transactions, contrats, revenus et impact RSE depuis une interface unique adaptée à votre rôle.',
    gradient: 'from-violet-500 to-purple-500',
  },
];

const MATERIAL_CATEGORIES = [
  { name: 'Métaux', icon: '⚙️', color: '#f59e0b' },
  { name: 'Plastiques', icon: '♻️', color: '#3b82f6' },
  { name: 'Biomasse', icon: '🌿', color: '#10b981' },
  { name: 'Chimiques', icon: '🧪', color: '#ef4444' },
  { name: 'Textile', icon: '🧵', color: '#0ea5e9' },
  { name: 'BTP', icon: '🏗️', color: '#78716c' },
  { name: 'Verre', icon: '🔬', color: '#06b6d4' },
  { name: 'Papier', icon: '📄', color: '#a3e635' },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* ═══ HERO SECTION ═══ */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '120px 24px 80px',
        position: 'relative',
      }}>
        {/* Glowing orbs background */}
        <div style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 70%)',
          top: '10%',
          left: '10%',
          filter: 'blur(60px)',
          animation: 'float 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)',
          bottom: '15%',
          right: '15%',
          filter: 'blur(40px)',
          animation: 'float 6s ease-in-out infinite reverse',
        }} />

        <div style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          maxWidth: '900px',
          position: 'relative',
          zIndex: 1,
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '9999px',
            background: 'rgba(13, 148, 136, 0.1)',
            border: '1px solid rgba(13, 148, 136, 0.25)',
            marginBottom: '24px',
            fontSize: '0.85rem',
            color: 'var(--color-primary-400)',
            fontWeight: 600,
          }}>
            🌿 Plateforme B2B — Économie Circulaire Industrielle
          </div>

          {/* Main heading */}
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: '24px',
            letterSpacing: '-0.03em',
          }}>
            <span style={{ color: 'var(--color-text-primary)' }}>
              Transformer le{' '}
            </span>
            <span style={{
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              déchet d&apos;une usine
            </span>
            <br />
            <span style={{ color: 'var(--color-text-primary)' }}>
              en la{' '}
            </span>
            <span style={{
              background: 'linear-gradient(135deg, #10b981, #34d399)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              matière première
            </span>
            <span style={{ color: 'var(--color-text-primary)' }}>
              {' '}d&apos;une autre.
            </span>
          </h1>

          <p style={{
            fontSize: '1.15rem',
            color: 'var(--color-text-secondary)',
            maxWidth: '650px',
            margin: '0 auto 40px',
            lineHeight: 1.7,
          }}>
            SymbioNexus connecte automatiquement producteurs et consommateurs de matières secondaires
            grâce à l&apos;IA, avec traçabilité complète et génération automatique de crédits carbone.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={isAuthenticated ? '/dashboard' : '/register'}>
              <button className="btn-primary" style={{ fontSize: '1.05rem', padding: '16px 36px' }}>
                {isAuthenticated ? '📊 Mon tableau de bord' : '🚀 Démarrer gratuitement'}
              </button>
            </Link>
            <Link href="/marketplace">
              <button className="btn-secondary" style={{ fontSize: '1.05rem', padding: '16px 36px' }}>
                🔍 Explorer la marketplace
              </button>
            </Link>
          </div>
        </div>

        {/* Animated stats row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          width: '100%',
          maxWidth: '900px',
          marginTop: '80px',
          position: 'relative',
          zIndex: 1,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.3s',
        }}>
          {STATS.map((stat, i) => (
            <div key={i} className="glass-card" style={{
              padding: '20px 16px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{stat.icon}</div>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES SECTION ═══ */}
      <section style={{
        padding: '100px 24px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '2.5rem',
            fontWeight: 800,
            marginBottom: '16px',
          }}>
            Les trois piliers de SymbioNexus
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
            Une infrastructure complète pour l&apos;économie circulaire industrielle
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
        }}>
          {FEATURES.map((feature, i) => (
            <div key={i} className="neo-card" style={{
              padding: '32px 28px',
              animationDelay: `${i * 150}ms`,
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(13, 148, 136, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                marginBottom: '20px',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
              }}>
                {feature.icon}
              </div>
              <h3 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.2rem',
                fontWeight: 700,
                marginBottom: '12px',
              }}>
                {feature.title}
              </h3>
              <p style={{
                color: 'var(--color-text-secondary)',
                fontSize: '0.9rem',
                lineHeight: 1.7,
              }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ MATERIAL CATEGORIES ═══ */}
      <section style={{
        padding: '80px 24px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '2rem',
            fontWeight: 800,
            marginBottom: '12px',
          }}>
            Catégories de matières
          </h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Plus de 10 catégories de matériaux industriels disponibles
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '16px',
        }}>
          {MATERIAL_CATEGORIES.map((cat, i) => (
            <div key={i} className="glass-card" style={{
              padding: '24px 16px',
              textAlign: 'center',
              cursor: 'pointer',
            }}>
              <div style={{
                fontSize: '2rem',
                marginBottom: '12px',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              }}>
                {cat.icon}
              </div>
              <div style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: cat.color,
              }}>
                {cat.name}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA SECTION ═══ */}
      <section style={{
        padding: '100px 24px',
        textAlign: 'center',
      }}>
        <div className="neo-card" style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '60px 40px',
          background: 'linear-gradient(145deg, rgba(13, 148, 136, 0.08), rgba(10, 17, 40, 0.9))',
          border: '1px solid rgba(13, 148, 136, 0.2)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(13, 148, 136, 0.08), transparent 70%)',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '2rem',
              fontWeight: 800,
              marginBottom: '16px',
            }}>
              Prêt à rejoindre l&apos;économie circulaire ?
            </h2>
            <p style={{
              color: 'var(--color-text-secondary)',
              marginBottom: '32px',
              fontSize: '1.05rem',
            }}>
              Inscrivez votre entreprise en 2 minutes et commencez à valoriser vos déchets industriels.
            </p>
            <Link href="/register">
              <button className="btn-primary" style={{ fontSize: '1.1rem', padding: '18px 40px' }}>
                🌿 Créer mon compte entreprise
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{
        padding: '40px 24px',
        borderTop: '1px solid var(--border-subtle)',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '16px',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
          }}>🌿</div>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: '1.1rem',
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            SymbioNexus
          </span>
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          © 2024 SymbioNexus — La Marketplace Industrielle Intelligente de l&apos;Économie Circulaire
        </p>
      </footer>
    </div>
  );
}
