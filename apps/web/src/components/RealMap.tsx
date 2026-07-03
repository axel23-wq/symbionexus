'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Recalcule la taille de la carte après montage (corrige le rendu quand la carte
// était dans un conteneur masqué / onglet inactif au moment de l'initialisation)
function InvalidateOnMount() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

// Couleur du marqueur selon la catégorie
const catColor = (cat: string): string => {
  switch (cat) {
    case 'BIOMASS': return '#34d399';
    case 'METALS': return '#94a3b8';
    case 'TEXTILE': return '#c084fc';
    case 'WOOD': return '#fbbf24';
    case 'PLASTICS': return '#60a5fa';
    case 'CHEMICALS':
    case 'CHEMICAL': return '#f87171';
    case 'GLASS': return '#22d3ee';
    case 'OILS': return '#38bdf8';
    default: return '#60a5fa';
  }
};

// Marqueur "goutte" personnalisé (évite le bug des icônes Leaflet dans les bundlers)
const pinIcon = (color: string) =>
  L.divIcon({
    className: '',
    html: `<div style="width:20px;height:20px;background:${color};border:2.5px solid #0a0f1e;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px ${color}aa;"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
    popupAnchor: [0, -18],
  });

const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;background:#10b981;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(16,185,129,0.35);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -10],
});

interface RealMapProps {
  listings: any[];
  center: { lat: number; lon: number };
  radiusKm: number | null;
}

export default function RealMap({ listings, center, radiusKm }: RealMapProps) {
  return (
    <MapContainer
      center={[center.lat, center.lon]}
      zoom={6}
      scrollWheelZoom={false}
      style={{ height: '100%', width: '100%', background: '#0a1628' }}
    >
      <InvalidateOnMount />
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {radiusKm !== null && radiusKm > 0 && (
        <Circle
          center={[center.lat, center.lon]}
          radius={radiusKm * 1000}
          pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.06, weight: 1.5 }}
        />
      )}

      <Marker position={[center.lat, center.lon]} icon={userIcon}>
        <Popup>📍 Votre position</Popup>
      </Marker>

      {listings.map((l) =>
        typeof l.latitude === 'number' && typeof l.longitude === 'number' ? (
          <Marker key={l.id} position={[l.latitude, l.longitude]} icon={pinIcon(catColor(l.materialCategory))}>
            <Popup>
              <div style={{ minWidth: 150 }}>
                <strong style={{ fontSize: 13 }}>{l.title}</strong>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                  {l.materialCategory} · {l.volumeKg >= 1000 ? `${l.volumeKg / 1000}t` : `${l.volumeKg} kg`}
                </div>
                <div style={{ fontSize: 12, marginTop: 2 }}>
                  {l.pricePerKg ? `${l.pricePerKg} FCFA/kg` : 'Prix à débattre'}
                </div>
              </div>
            </Popup>
          </Marker>
        ) : null
      )}
    </MapContainer>
  );
}
