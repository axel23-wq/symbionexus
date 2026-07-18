'use client';

import { useEffect, useState } from 'react';
import { Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { io, Socket } from 'socket.io-client';

export function AIMatchVisualizer() {
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    // Connexion au WebSocket du GeoCore (namespace /geospatial)
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const socket: Socket = io(`${socketUrl}/geospatial`);

    socket.on('match.found', (data) => {
      console.log('🌍 AI Matches received:', data);
      setMatches(data.matches);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (matches.length === 0) return null;

  return (
    <>
      {matches.map((match, idx) => {
        const seller = match.sellerCompany;
        const buyer = match.buyerCompany;
        
        if (!seller || !buyer) return null;

        const origin: L.LatLngExpression = [seller.companyLatitude, seller.companyLongitude];
        const destination: L.LatLngExpression = [buyer.companyLatitude, buyer.companyLongitude];

        return (
          <div key={match.id}>
            <Polyline 
              positions={[origin, destination]} 
              pathOptions={{ 
                color: idx === 0 ? '#10b981' : '#3b82f6', // Le premier est vert, les autres bleus
                weight: Math.max(2, 4 - (idx * 0.5)), 
                dashArray: '10, 10', 
                opacity: 0.9 - (idx * 0.15),
                className: 'animate-pulse' 
              }} 
            />
            <Popup position={destination} className="glassmorphism-popup">
              <div className="p-3 min-w-[250px] bg-slate-900/90 text-white rounded-lg border border-slate-700 shadow-xl">
                <div className="flex justify-between items-center mb-3 border-b border-slate-700 pb-2">
                  <span className="font-bold text-sm truncate max-w-[140px] text-emerald-300">
                    {buyer.name}
                  </span>
                  <div className="flex flex-col items-end">
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">
                      {match.compatibilityScore}% Match
                    </span>
                    {match.xaiJustification?.details?.riskLevel && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-sm ${
                        match.xaiJustification.details.riskLevel === 'Faible' ? 'bg-green-500/20 text-green-400' : 
                        match.xaiJustification.details.riskLevel === 'Moyen' ? 'bg-yellow-500/20 text-yellow-400' : 
                        'bg-red-500/20 text-red-400'
                      }`}>
                        Risque {match.xaiJustification.details.riskLevel}
                      </span>
                    )}
                  </div>
                </div>
                
                {match.xaiJustification ? (
                  <div className="text-[10px] text-slate-300 mb-3 leading-relaxed whitespace-pre-line bg-black/30 p-2 rounded border border-slate-700/50">
                    <span className="font-semibold text-emerald-400 mb-1 block">🧠 Explication de l'IA (XAI)</span>
                    {match.xaiJustification.summary}
                  </div>
                ) : (
                  <div className="text-xs text-slate-300 mb-3 italic leading-relaxed">
                    "{match.scoreBreakdown?.aiInsight || 'Analyse en cours...'}"
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-[11px] mt-2 pt-2 border-t border-slate-700">
                  <div className="flex flex-col">
                    <span className="text-slate-400 mb-1">Distance réelle</span>
                    <span className="font-medium text-slate-200">
                      {match.xaiJustification?.details?.distanceKm || match.distanceKm} km
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-400 mb-1">Impact Logistique</span>
                    <span className="font-bold text-rose-400">
                      {match.xaiJustification?.details?.estimatedLogisticsCostFcfa 
                        ? `${match.xaiJustification.details.estimatedLogisticsCostFcfa} FCFA` 
                        : `+${match.scoreBreakdown?.co2FootprintKg || 0} kg CO₂`}
                    </span>
                  </div>
                </div>
              </div>
            </Popup>
          </div>
        );
      })}
    </>
  );
}
