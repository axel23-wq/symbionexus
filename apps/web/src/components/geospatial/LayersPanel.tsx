'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LayersPanelProps {
  activeTheme: 'dark' | 'satellite' | 'light';
  onThemeChange: (theme: 'dark' | 'satellite' | 'light') => void;
  activeLayers: string[];
  onToggleLayer: (layerId: string) => void;
}

export function LayersPanel({ activeTheme, onThemeChange, activeLayers, onToggleLayer }: LayersPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-[#0a1628]/80 backdrop-blur-xl border border-gray-700/50 shadow-lg text-white hover:bg-[#0f1f3a]/90 transition-all z-20"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="absolute top-14 right-0 w-64 rounded-2xl bg-[#0a1628]/80 backdrop-blur-xl border border-gray-700/50 p-4 shadow-2xl text-white"
          >
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Type de Carte</h3>
            <div className="flex gap-2 mb-6">
              <button 
                onClick={() => onThemeChange('dark')}
                className={`flex-1 py-2 text-xs rounded-lg border ${activeTheme === 'dark' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-gray-700 hover:bg-gray-800'}`}
              >
                Dark
              </button>
              <button 
                onClick={() => onThemeChange('satellite')}
                className={`flex-1 py-2 text-xs rounded-lg border ${activeTheme === 'satellite' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-gray-700 hover:bg-gray-800'}`}
              >
                Satellite
              </button>
            </div>

            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Couches (Layers)</h3>
            <div className="space-y-3">
              {[
                { id: 'industries', label: 'Zones Industrielles', color: 'bg-blue-500' },
                { id: 'trucks', label: 'Camions GPS Live', color: 'bg-emerald-500' },
                { id: 'waste', label: 'Points de Collecte', color: 'bg-yellow-500' },
                { id: 'heatmap', label: 'Heatmap CO₂', color: 'bg-rose-500' },
              ].map(layer => {
                const isActive = activeLayers.includes(layer.id);
                return (
                  <label key={layer.id} className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${layer.color} shadow-[0_0_8px_currentColor]`} />
                      <span className="text-sm group-hover:text-white transition-colors">{layer.label}</span>
                    </div>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input 
                        type="checkbox" 
                        name="toggle" 
                        id={layer.id} 
                        className={`toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 border-gray-600 appearance-none cursor-pointer transition-transform duration-200 ${isActive ? 'translate-x-5 border-emerald-500' : ''}`}
                        checked={isActive}
                        onChange={() => onToggleLayer(layer.id)}
                      />
                      <label htmlFor={layer.id} className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-600 cursor-pointer"></label>
                    </div>
                  </label>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
