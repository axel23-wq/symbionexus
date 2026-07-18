'use client';

import { useState, useEffect } from 'react';
import styles from './AISettings.module.css';

interface AISettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'pdf' | 'txt' | 'json') => void;
  onClearHistory: () => void;
  messages: any[];
}

export default function AISettings({ isOpen, onClose, onExport, onClearHistory, messages }: AISettingsProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [fontSize, setFontSize] = useState(15);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [aiProvider, setAiProvider] = useState('mock');
  const [language, setLanguage] = useState('fr');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('aiSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      setTheme(settings.theme || 'dark');
      setFontSize(settings.fontSize || 15);
      setSoundEnabled(settings.soundEnabled !== false);
      setAutoSave(settings.autoSave !== false);
      setPrivacyMode(settings.privacyMode || false);
      setAiProvider(settings.aiProvider || 'mock');
      setLanguage(settings.language || 'fr');
    }
  }, []);

  const saveSettings = (updates: Partial<typeof theme> & any) => {
    const current = localStorage.getItem('aiSettings') ? JSON.parse(localStorage.getItem('aiSettings')!) : {};
    const newSettings = { ...current, ...updates };
    localStorage.setItem('aiSettings', JSON.stringify(newSettings));
  };

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    saveSettings({ theme: newTheme });
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    saveSettings({ fontSize: size });
    document.documentElement.style.fontSize = `${size}px`;
  };

  const handleSoundToggle = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    saveSettings({ soundEnabled: newValue });
  };

  const handleAutoSaveToggle = () => {
    const newValue = !autoSave;
    setAutoSave(newValue);
    saveSettings({ autoSave: newValue });
  };

  const handlePrivacyModeToggle = () => {
    const newValue = !privacyMode;
    setPrivacyMode(newValue);
    saveSettings({ privacyMode: newValue });
  };

  const handleProviderChange = (provider: string) => {
    setAiProvider(provider);
    saveSettings({ aiProvider: provider });
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    saveSettings({ language: lang });
  };

  const handleClear = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer toute l\'historique? Cette action est irréversible.')) {
      onClearHistory();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles['settings-overlay']} onClick={onClose}>
      <div className={styles['settings-panel']} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles['settings-header']}>
          <h2>⚙️ Paramètres</h2>
          <button className={styles['close-btn']} onClick={onClose}>✕</button>
        </div>

        {/* Settings Content */}
        <div className={styles['settings-content']}>
          {/* Theme Section */}
          <div className={styles['setting-group']}>
            <label className={styles['setting-label']}>🎨 Thème</label>
            <div className={styles['button-group']}>
              <button
                className={`${styles['btn-option']} ${theme === 'dark' ? styles['active'] : ''}`}
                onClick={() => handleThemeChange('dark')}
              >
                🌙 Sombre
              </button>
              <button
                className={`${styles['btn-option']} ${theme === 'light' ? styles['active'] : ''}`}
                onClick={() => handleThemeChange('light')}
              >
                ☀️ Clair
              </button>
            </div>
          </div>

          {/* Font Size Section */}
          <div className={styles['setting-group']}>
            <label className={styles['setting-label']}>📝 Taille police</label>
            <div className={styles['slider-container']}>
              <span>A</span>
              <input
                type="range"
                min="12"
                max="20"
                value={fontSize}
                onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
                className={styles['slider']}
              />
              <span style={{ fontSize: '18px' }}>A</span>
              <span className={styles['value']}>{fontSize}px</span>
            </div>
          </div>

          {/* AI Provider Section */}
          <div className={styles['setting-group']}>
            <label className={styles['setting-label']}>🤖 Fournisseur IA</label>
            <div className={styles['button-group']}>
              {['mock', 'groq', 'claude'].map((provider) => (
                <button
                  key={provider}
                  className={`${styles['btn-option']} ${aiProvider === provider ? styles['active'] : ''}`}
                  onClick={() => handleProviderChange(provider)}
                >
                  {provider === 'mock' && '🎭 Demo'}
                  {provider === 'groq' && '⚡ Groq'}
                  {provider === 'claude' && '✨ Claude'}
                </button>
              ))}
            </div>
          </div>

          {/* Language Section */}
          <div className={styles['setting-group']}>
            <label className={styles['setting-label']}>🌐 Langue</label>
            <div className={styles['button-group']}>
              <button
                className={`${styles['btn-option']} ${language === 'fr' ? styles['active'] : ''}`}
                onClick={() => handleLanguageChange('fr')}
              >
                🇫🇷 Français
              </button>
              <button
                className={`${styles['btn-option']} ${language === 'en' ? styles['active'] : ''}`}
                onClick={() => handleLanguageChange('en')}
              >
                🇬🇧 English
              </button>
            </div>
          </div>

          {/* Toggle Settings */}
          <div className={styles['toggle-group']}>
            <div className={styles['toggle-item']}>
              <label>🔊 Sons activés</label>
              <button
                className={`${styles['toggle']} ${soundEnabled ? styles['on'] : ''}`}
                onClick={handleSoundToggle}
              >
                {soundEnabled ? '✓' : '✗'}
              </button>
            </div>
            <div className={styles['toggle-item']}>
              <label>💾 Sauvegarde auto</label>
              <button
                className={`${styles['toggle']} ${autoSave ? styles['on'] : ''}`}
                onClick={handleAutoSaveToggle}
              >
                {autoSave ? '✓' : '✗'}
              </button>
            </div>
            <div className={styles['toggle-item']}>
              <label>🔒 Mode privé</label>
              <button
                className={`${styles['toggle']} ${privacyMode ? styles['on'] : ''}`}
                onClick={handlePrivacyModeToggle}
              >
                {privacyMode ? '✓' : '✗'}
              </button>
            </div>
          </div>

          {/* Export Section */}
          <div className={styles['setting-group']}>
            <label className={styles['setting-label']}>📥 Exporter conversation ({messages.length} messages)</label>
            <div className={styles['button-group']}>
              <button className={styles['btn-export']} onClick={() => onExport('pdf')}>📄 PDF</button>
              <button className={styles['btn-export']} onClick={() => onExport('txt')}>📝 TXT</button>
              <button className={styles['btn-export']} onClick={() => onExport('json')}>⚙️ JSON</button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className={styles['danger-zone']}>
            <label className={styles['setting-label']}>🗑️ Zone dangereuse</label>
            <button className={styles['btn-danger']} onClick={handleClear}>
              ⚠️ Supprimer l'historique
            </button>
          </div>

          {/* Advanced Settings Toggle */}
          <div className={styles['advanced-toggle']}>
            <button onClick={() => setShowAdvanced(!showAdvanced)}>
              {showAdvanced ? '▼' : '▶'} Paramètres avancés
            </button>
          </div>

          {showAdvanced && (
            <div className={styles['advanced-section']}>
              <div className={styles['info-box']}>
                <p>📌 <strong>Mode Démo:</strong> Tapez `/demo-soutenance` pour auto-pilot</p>
                <p>📌 <strong>Enregistrement vocal:</strong> Accès au microphone requis</p>
                <p>📌 <strong>Upload fichiers:</strong> Jusqu'à 100MB par fichier</p>
                <p>📌 <strong>Mode privé:</strong> Les données ne sont pas sauvegardées</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles['settings-footer']}>
          <button className={styles['btn-close']} onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
