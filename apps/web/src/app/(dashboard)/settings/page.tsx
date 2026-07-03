'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import LanguageSelect from '@/components/settings/LanguageSelect';
import ThemeToggle from '@/components/settings/ThemeToggle';
import NotificationToggles from '@/components/settings/NotificationToggles';
import CompanyProfileForm from '@/components/settings/CompanyProfileForm';
import CertificationDropzone from '@/components/settings/CertificationDropzone';
import ApiKeysPanel from '@/components/settings/ApiKeysPanel';
import WebhookConfig from '@/components/settings/WebhookConfig';
import AuditLogTable from '@/components/settings/AuditLogTable';

type Tab = 'profile' | 'appearance' | 'notifications' | 'developer' | 'security';

export default function SettingsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSettingsProfile()
      .then((res) => setProfile(res?.data ?? null))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const tabs: { id: Tab; icon: string; labelKey: string }[] = [
    { id: 'profile', icon: '🏢', labelKey: 'settings.tab.profile' },
    { id: 'appearance', icon: '🎨', labelKey: 'settings.tab.appearance' },
    { id: 'notifications', icon: '🔔', labelKey: 'settings.tab.notifications' },
    { id: 'developer', icon: '⚙️', labelKey: 'settings.tab.developer' },
    { id: 'security', icon: '🛡️', labelKey: 'settings.tab.security' },
  ];

  const company = profile?.company ?? null;
  const certs = company?.complianceDocuments ?? [];
  const notifPrefs = profile?.user?.notificationPrefs ?? null;

  return (
    <>
      <style>{`
        .set-root { max-width: 920px; margin: 0 auto; padding: 28px 24px 60px; color: var(--set-text); }
        .set-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 22px; }
        .set-tab { display: flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 12px; border: 1.5px solid var(--set-card-border); background: var(--set-card); color: var(--set-text-dim); font-size: 13px; font-weight: 600; cursor: pointer; transition: all .2s; }
        .set-tab:hover:not(.active) { border-color: rgba(16,185,129,0.4); color: var(--set-text); }
        .set-tab.active { border-color: rgba(16,185,129,0.6); background: rgba(16,185,129,0.10); color: #10b981; box-shadow: 0 4px 16px rgba(16,185,129,0.15); }
        .set-card { background: var(--set-card); border: 1.5px solid var(--set-card-border); border-radius: 18px; padding: 26px 28px; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); box-shadow: 0 8px 32px rgba(0,0,0,0.18); }
        .set-card + .set-card { margin-top: 18px; }
        .set-card-title { font-size: 16px; font-weight: 700; color: var(--set-text); margin-bottom: 4px; }
        .set-card-desc { font-size: 13px; color: var(--set-text-muted); margin-bottom: 22px; }
        .set-label { display: block; font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--set-text-dim); margin-bottom: 8px; }
        .set-input { width: 100%; background: var(--set-input-bg); border: 1.5px solid var(--set-input-border); border-radius: 11px; padding: 12px 15px; color: var(--set-text); font-size: 14px; outline: none; transition: border-color .2s; font-family: inherit; }
        .set-input:focus { border-color: #10b981; }
        .set-btn-primary { padding: 11px 22px; border-radius: 11px; border: none; background: linear-gradient(135deg,#0d9488,#10b981); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 14px rgba(16,185,129,0.28); transition: all .2s; white-space: nowrap; }
        .set-btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(16,185,129,0.4); }
        .set-btn-primary:disabled { opacity: .6; cursor: not-allowed; }
        .set-btn-ghost { padding: 8px 14px; border-radius: 10px; border: 1.5px solid var(--set-input-border); background: transparent; color: var(--set-text-dim); font-size: 12px; font-weight: 600; cursor: pointer; transition: all .2s; white-space: nowrap; }
        .set-btn-ghost:hover { color: var(--set-text); border-color: #10b981; }
        .set-btn-danger { padding: 7px 16px; border-radius: 10px; border: 1.5px solid rgba(244,63,94,0.35); background: rgba(244,63,94,0.10); color: #fda4af; font-size: 12px; font-weight: 600; cursor: pointer; transition: all .2s; white-space: nowrap; }
        .set-btn-danger:hover { border-color: rgba(244,63,94,0.7); color: #fecdd3; background: rgba(244,63,94,0.18); }
        .set-choice { display: flex; align-items: center; gap: 8px; padding: 11px 20px; border-radius: 12px; border: 1.5px solid var(--set-card-border); background: var(--set-input-bg); color: var(--set-text-dim); font-size: 13px; font-weight: 600; cursor: pointer; transition: all .2s; }
        .set-choice.active { border-color: rgba(16,185,129,0.6); background: rgba(16,185,129,0.10); color: #10b981; }
        .set-select { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 12px 15px; border-radius: 11px; border: 1.5px solid var(--set-input-border); background: var(--set-input-bg); color: var(--set-text); font-size: 14px; cursor: pointer; font-weight: 500; }
        .set-dropdown { position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 50; background: var(--set-card); border: 1.5px solid var(--set-card-border); border-radius: 12px; padding: 6px; box-shadow: 0 16px 40px rgba(0,0,0,0.3); max-height: 320px; overflow-y: auto; }
        .set-dropdown-item { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 9px; border: none; background: transparent; color: var(--set-text); font-size: 14px; cursor: pointer; transition: background .15s; }
        .set-dropdown-item:hover { background: var(--set-hover); }
        .set-dropdown-item.active { background: rgba(16,185,129,0.10); }
        .set-toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 4px; border-bottom: 1px solid var(--set-card-border); }
        .set-toggle-row:last-of-type { border-bottom: none; }
        .set-switch { position: relative; width: 46px; height: 26px; border-radius: 20px; border: none; background: var(--set-input-border); cursor: pointer; transition: background .25s; flex-shrink: 0; }
        .set-switch.on { background: linear-gradient(135deg,#0d9488,#10b981); }
        .set-switch-knob { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: transform .25s cubic-bezier(.4,0,.2,1); box-shadow: 0 2px 6px rgba(0,0,0,0.3); }
        .set-switch.on .set-switch-knob { transform: translateX(20px); }
        .set-dropzone { border: 2px dashed var(--set-input-border); border-radius: 14px; padding: 32px 20px; text-align: center; cursor: pointer; transition: all .25s; }
        .set-dropzone:hover, .set-dropzone.drag { border-color: #10b981; background: rgba(16,185,129,0.03); }
        .set-cert-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 11px; background: var(--set-input-bg); border: 1.5px solid var(--set-card-border); }
        .set-cert-remove { width: 26px; height: 26px; border-radius: 8px; border: 1.5px solid var(--set-card-border); background: transparent; color: var(--set-text-muted); cursor: pointer; }
        .set-cert-remove:hover { border-color: rgba(244,63,94,0.6); color: #f87171; }
        .set-newkey { background: rgba(251,191,36,0.07); border: 1.5px solid rgba(251,191,36,0.3); border-radius: 12px; padding: 14px 16px; margin-bottom: 16px; }
        .set-key-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px 16px; border-radius: 11px; background: var(--set-input-bg); border: 1.5px solid var(--set-card-border); }
        .set-badge-revoked { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 8px; background: rgba(148,163,184,0.15); color: var(--set-text-muted); }
        .set-badge-ok { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 8px; background: rgba(16,185,129,0.15); color: #34d399; }
        .set-badge-fail { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 8px; background: rgba(239,68,68,0.15); color: #f87171; }
        .set-table-wrap { overflow-x: auto; }
        .set-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .set-table th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--set-text-muted); padding: 10px 12px; border-bottom: 1.5px solid var(--set-card-border); }
        .set-table td { padding: 12px; border-bottom: 1px solid var(--set-card-border); }
        .set-field { margin-bottom: 18px; }
        @media (max-width: 640px) { .set-root { padding: 20px 14px 48px; } }
      `}</style>

      <div className="set-root">
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 24 }}>⚙️</span>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--set-text)' }}>{t('settings.title')}</h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--set-text-muted)' }}>{t('settings.subtitle')}</p>
        </div>

        <div className="set-tabs">
          {tabs.map((tb) => (
            <button key={tb.id} type="button" className={`set-tab ${tab === tb.id ? 'active' : ''}`} onClick={() => setTab(tb.id)}>
              <span>{tb.icon}</span>
              <span>{t(tb.labelKey)}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="set-card"><div className="spinner" style={{ margin: '20px auto' }} /></div>
        ) : (
          <>
            {tab === 'profile' && (
              <>
                <div className="set-card">
                  <div className="set-card-title">{t('settings.profile.title')}</div>
                  <div className="set-card-desc">{t('settings.profile.desc')}</div>
                  <CompanyProfileForm company={company} />
                </div>
                <div className="set-card">
                  <div className="set-card-title">{t('settings.profile.certifications')}</div>
                  <div className="set-card-desc">{t('settings.profile.dropHint')}</div>
                  <CertificationDropzone initialDocs={certs} />
                </div>
              </>
            )}

            {tab === 'appearance' && (
              <div className="set-card">
                <div className="set-card-title">{t('settings.appearance.title')}</div>
                <div className="set-card-desc">{t('settings.appearance.desc')}</div>
                <div className="set-field">
                  <label className="set-label">{t('settings.appearance.language')}</label>
                  <LanguageSelect />
                </div>
                <div className="set-field">
                  <label className="set-label">{t('settings.appearance.theme')}</label>
                  <ThemeToggle />
                </div>
              </div>
            )}

            {tab === 'notifications' && (
              <div className="set-card">
                <div className="set-card-title">{t('settings.notif.title')}</div>
                <div className="set-card-desc">{t('settings.notif.desc')}</div>
                <NotificationToggles initial={notifPrefs} />
              </div>
            )}

            {tab === 'developer' && (
              <>
                <div className="set-card">
                  <div className="set-card-title">{t('settings.dev.apiKeys')}</div>
                  <div className="set-card-desc">{t('settings.dev.desc')}</div>
                  <ApiKeysPanel />
                </div>
                <div className="set-card">
                  <div className="set-card-title">{t('settings.dev.webhook')}</div>
                  <div className="set-card-desc">{t('settings.dev.webhookHint')}</div>
                  <WebhookConfig initialUrl={company?.webhookUrl} />
                </div>
              </>
            )}

            {tab === 'security' && (
              <div className="set-card">
                <div className="set-card-title">{t('settings.security.title')}</div>
                <div className="set-card-desc">{t('settings.security.desc')}</div>
                <AuditLogTable />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
