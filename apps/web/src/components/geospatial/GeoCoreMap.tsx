'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { io } from 'socket.io-client';
import { GeoControlPanel } from './GeoControlPanel';
import { LayersPanel } from './LayersPanel';
import { AIMatchVisualizer } from './AIMatchVisualizer';
import { HeatmapLayer } from './HeatmapLayer';
import { api } from '@/lib/api';

function InvalidateOnMount() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

const mapStyles = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
};

const defaultCenter = [4.0511, 9.7679]; // Douala Center

export default function GeoCoreMap() {
  const [activeTheme, setActiveTheme] = useState<'dark' | 'satellite' | 'light'>('dark');
  const [activeLayers, setActiveLayers] = useState<string[]>(['industries', 'trucks', 'waste', 'heatmap']);
  
  const [points, setPoints] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<Record<string, any>>({});
  const [heatmapData, setHeatmapData] = useState<[number, number, number][]>([]);

  // Chargement des données initiales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load some dummy heatmap data for testing
        setHeatmapData([
          [4.0511, 9.7679, 0.8],
          [4.0621, 9.7719, 0.6],
          [4.0411, 9.7579, 0.9],
          [4.0311, 9.7879, 0.5],
        ]);
        
        // Initial vehicles
        const logRes = await api.getLogisticsTransports();
        if (logRes.data) {
          const vMap: Record<string, any> = {};
          logRes.data.forEach((v: any) => vMap[v.id] = v);
          setVehicles(vMap);
        }
      } catch (err) {
        console.error('Failed to load initial map data', err);
      }
    };
    loadInitialData();
  }, []);

  // WebSockets pour les véhicules en temps réel
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000', {
      path: '/socket.io',
    });

    socket.on('connect', () => {
      console.log('Connecté au GeoCore WebSocket');
    });

    socket.on('location_update', (data: { entityId: string; lat: number; lng: number; timestamp: string }) => {
      setVehicles(prev => ({
        ...prev,
        [data.entityId]: {
          ...prev[data.entityId],
          id: data.entityId,
          latitude: data.lat,
          longitude: data.lng,
          lastUpdate: data.timestamp,
        }
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const customIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  const truckIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/819/819873.png',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    className: 'truck-marker-icon'
  });

  return (
    <div className="relative w-full h-[calc(100vh-64px)] bg-gray-900 overflow-hidden">
      {/* 1. La Carte */}
      <MapContainer
        center={defaultCenter as [number, number]}
        zoom={13}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <InvalidateOnMount />
        <TileLayer
          attribution='&copy; SymbioNexus OS'
          url={mapStyles[activeTheme]}
        />
        
        {/* Heatmap CO2 ou Demande */}
        {activeLayers.includes('heatmap') && heatmapData.length > 0 && (
          <HeatmapLayer 
            points={heatmapData} 
            options={{ radius: 30, blur: 20, maxZoom: 17, gradient: { 0.4: 'yellow', 0.6: 'orange', 1.0: 'red' } }} 
          />
        )}

        {/* Camions en temps réel */}
        {activeLayers.includes('trucks') && Object.values(vehicles).map((v) => (
          v.latitude && v.longitude ? (
            <Marker key={v.id} position={[v.latitude, v.longitude]} icon={truckIcon}>
              <Popup className="glassmorphism-popup">
                <div className="p-2 text-sm">
                  <h3 className="font-bold text-gray-900 mb-1">Camion {v.id.substring(0,6)}</h3>
                  <p className="text-gray-500">Dernière maj: {new Date(v.lastUpdate || Date.now()).toLocaleTimeString()}</p>
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}

        {/* Cluster de points fixes (Matières, Industries) */}
        {activeLayers.includes('waste') && points.length > 0 && (
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={50}
            iconCreateFunction={(cluster: any) => {
              const count = cluster.getChildCount();
              return L.divIcon({
                html: `<div class="flex items-center justify-center w-10 h-10 bg-emerald-500/80 backdrop-blur-md text-white font-bold rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] border-2 border-emerald-300">
                        ${count}
                       </div>`,
                className: 'custom-cluster-icon',
                iconSize: L.point(40, 40, true),
              });
            }}
          >
            {points.map((p, i) => (
              <Marker key={i} position={[p.lat, p.lng]} icon={customIcon}>
                <Popup className="glassmorphism-popup">
                  <div className="p-2">
                    <h3 className="font-bold text-gray-900">{p.name}</h3>
                    <p className="text-sm text-gray-500">{p.category}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        )}
        
        {/* Matchmaking IA visuel */}
        <AIMatchVisualizer />
      </MapContainer>

      {/* 2. Interface Premium en Glassmorphism par-dessus la carte */}
      <div className="absolute top-4 left-4 z-10">
        <GeoControlPanel />
      </div>

      <div className="absolute top-4 right-4 z-10">
        <LayersPanel 
          activeTheme={activeTheme} 
          onThemeChange={setActiveTheme}
          activeLayers={activeLayers}
          onToggleLayer={(layer) => {
            setActiveLayers(prev => prev.includes(layer) ? prev.filter(l => l !== layer) : [...prev, layer]);
          }}
        />
      </div>

      {/* Crosshair (Centre de la carte) optionnel pour le ciblage */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 opacity-20">
        <div className="w-8 h-8 border-2 border-emerald-500 rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
