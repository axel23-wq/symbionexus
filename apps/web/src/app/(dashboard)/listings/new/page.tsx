'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

// Villes disponibles avec leurs coordonnées (alignées sur la page Mes annonces)
const CITIES: Record<string, { lat: number; lon: number }> = {
  'Lyon': { lat: 45.7578, lon: 4.8320 },
  'Saint-Étienne': { lat: 45.4397, lon: 4.3872 },
  'Marseille': { lat: 43.2965, lon: 5.3698 },
  'Grenoble': { lat: 45.1885, lon: 5.7245 },
  'Toulouse': { lat: 43.6047, lon: 1.4442 },
  'Paris': { lat: 48.8566, lon: 2.3522 },
  'Lille': { lat: 50.6292, lon: 3.0573 },
};

export default function NewListingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    materialType: '',
    materialCategory: 'BIOMASS',
    description: '',
    volumeKg: 1000,
    frequency: 'MONTHLY',
    pricePerKg: 0.1,
    city: 'Lyon',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const coords = CITIES[formData.city] || CITIES['Lyon'];
      await api.createListing({
        title: formData.title,
        materialType: formData.materialType,
        materialCategory: formData.materialCategory,
        description: formData.description,
        volumeKg: Number(formData.volumeKg),
        frequency: formData.frequency,
        pricePerKg: Number(formData.pricePerKg),
        latitude: coords.lat,
        longitude: coords.lon,
      });
      router.push('/listings');
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">➕ Nouvelle annonce</h1>
          <p className="page-subtitle">Détaillez la matière que vous souhaitez valoriser</p>
        </div>
      </div>

      <div className="neo-card" style={{ padding: '32px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Titre de l&apos;annonce</label>
              <input type="text" name="title" className="input-field" required value={formData.title} onChange={handleChange} placeholder="Ex: Marc de café - 5 tonnes" />
            </div>

            <div>
              <label className="input-label">Catégorie</label>
              <select name="materialCategory" className="input-field" value={formData.materialCategory} onChange={handleChange}>
                <option value="BIOMASS">Biomasse</option>
                <option value="PLASTICS">Plastiques</option>
                <option value="METALS">Métaux</option>
                <option value="CHEMICALS">Chimie</option>
                <option value="TEXTILE">Textile</option>
                <option value="PAPER">Papier / Carton</option>
                <option value="GLASS">Verre</option>
                <option value="CONSTRUCTION">BTP</option>
                <option value="ELECTRONIC">DEEE</option>
              </select>
            </div>

            <div>
              <label className="input-label">Type précis</label>
              <input type="text" name="materialType" className="input-field" required value={formData.materialType} onChange={handleChange} placeholder="Ex: Marc de café usagé" />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Description</label>
              <textarea name="description" className="input-field" required value={formData.description} onChange={handleChange} rows={4} placeholder="Détaillez la pureté, le conditionnement, l'origine..." />
            </div>

            <div>
              <label className="input-label">Volume (kg)</label>
              <input type="number" name="volumeKg" className="input-field" required min={1} value={formData.volumeKg} onChange={handleChange} />
            </div>

            <div>
              <label className="input-label">Fréquence de disponibilité</label>
              <select name="frequency" className="input-field" value={formData.frequency} onChange={handleChange}>
                <option value="ON_DEMAND">À la demande / Lot unique</option>
                <option value="WEEKLY">Hebdomadaire</option>
                <option value="MONTHLY">Mensuel</option>
                <option value="QUARTERLY">Trimestriel</option>
              </select>
            </div>

            <div>
              <label className="input-label">Prix souhaité (€ / kg)</label>
              <input type="number" name="pricePerKg" step="0.01" className="input-field" required min={0} value={formData.pricePerKg} onChange={handleChange} />
            </div>

            <div>
              <label className="input-label">📍 Localisation</label>
              <select name="city" className="input-field" value={formData.city} onChange={handleChange}>
                {Object.keys(CITIES).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
            <button type="button" className="btn-secondary" onClick={() => router.back()}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Création...' : 'Créer l\'annonce'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
