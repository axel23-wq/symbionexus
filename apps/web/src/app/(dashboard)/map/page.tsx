'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Import dynamique pour désactiver le SSR (nécessaire pour Leaflet)
const GeoCoreMap = dynamic(
  () => import('@/components/geospatial/GeoCoreMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[calc(100vh-64px)] bg-[#0a1628] flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-emerald-500 font-bold tracking-widest uppercase">Initialisation du GeoCore...</h2>
      </div>
    )
  }
);

export default function GeoCorePage() {
  return (
    <div className="w-full h-[calc(100vh-64px)] overflow-hidden">
      <Suspense fallback={null}>
        <GeoCoreMap />
      </Suspense>
    </div>
  );
}
