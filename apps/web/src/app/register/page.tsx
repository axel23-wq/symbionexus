'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    companyName: '',
    companySector: 'Agroalimentaire',
    companyAddress: '',
    companyCity: '',
    companyCountry: 'France',
    companyLatitude: 48.8566,
    companyLongitude: 2.3522,
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'SELLER',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register(formData);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du compte');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', position: 'relative',
    }}>
      <div style={{
        position: 'absolute', width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)',
        top: '-10%', right: '-10%', filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      <div className="neo-card" style={{ width: '100%', maxWidth: '700px', padding: '48px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800 }}>
            Rejoindre SymbioNexus
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px' }}>
            Inscrivez votre entreprise et participez à l&apos;économie circulaire
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)', color: '#ef4444', fontSize: '0.85rem', marginBottom: '24px', textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px', marginBottom: '16px' }}>
                🏢 Informations Entreprise
              </h3>
            </div>
            
            <div>
              <label className="input-label">Nom de l&apos;entreprise</label>
              <input type="text" name="companyName" className="input-field" required value={formData.companyName} onChange={handleChange} />
            </div>
            <div>
              <label className="input-label">Secteur d&apos;activité</label>
              <select name="companySector" className="input-field" value={formData.companySector} onChange={handleChange}>
                <option value="Agroalimentaire">Agroalimentaire</option>
                <option value="Plasturgie">Plasturgie</option>
                <option value="Métallurgie">Métallurgie</option>
                <option value="BTP">BTP</option>
                <option value="Textile">Textile</option>
                <option value="Chimie">Chimie</option>
              </select>
            </div>
            <div>
              <label className="input-label">Rôle principal</label>
              <select name="role" className="input-field" value={formData.role} onChange={handleChange}>
                <option value="SELLER">Producteur de déchets (Vendeur)</option>
                <option value="BUYER">Valoriste / Recycleur (Acheteur)</option>
                <option value="TRANSPORTER">Transporteur</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Adresse</label>
              <input type="text" name="companyAddress" className="input-field" required value={formData.companyAddress} onChange={handleChange} />
            </div>
            <div>
              <label className="input-label">Ville</label>
              <input type="text" name="companyCity" className="input-field" required value={formData.companyCity} onChange={handleChange} />
            </div>
            <div>
              <label className="input-label">Pays</label>
              <input type="text" name="companyCountry" className="input-field" required value={formData.companyCountry} onChange={handleChange} />
            </div>
            <div>
              <label className="input-label">Latitude</label>
              <input type="number" name="companyLatitude" className="input-field" required min="-90" max="90" step="0.0001" value={formData.companyLatitude} onChange={handleChange} />
            </div>
            <div>
              <label className="input-label">Longitude</label>
              <input type="number" name="companyLongitude" className="input-field" required min="-180" max="180" step="0.0001" value={formData.companyLongitude} onChange={handleChange} />
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px', marginBottom: '16px' }}>
                👤 Compte Administrateur
              </h3>
            </div>

            <div>
              <label className="input-label">Prénom</label>
              <input type="text" name="firstName" className="input-field" required value={formData.firstName} onChange={handleChange} />
            </div>
            <div>
              <label className="input-label">Nom</label>
              <input type="text" name="lastName" className="input-field" required value={formData.lastName} onChange={handleChange} />
            </div>
            <div>
              <label className="input-label">Email professionnel</label>
              <input type="email" name="email" className="input-field" required value={formData.email} onChange={handleChange} />
            </div>
            <div>
              <label className="input-label">Mot de passe</label>
              <input type="password" name="password" className="input-field" required minLength={6} value={formData.password} onChange={handleChange} />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading} style={{ width: '100%', padding: '16px', fontSize: '1.05rem', marginTop: '16px' }}>
            {isLoading ? 'Création en cours...' : 'Créer mon compte'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
          Déjà un compte ? <Link href="/login" style={{ fontWeight: 600 }}>Se connecter</Link>
        </div>
      </div>
    </div>
  );
}
