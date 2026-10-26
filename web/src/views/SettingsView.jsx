import React, { useState } from 'react';
import {
  Sliders,
  Type,
  Eye,
  Zap,
  Volume2,
  Languages,
  Shield,
  Server,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function SettingsView() {
  const {
    settings,
    updateSetting,
    clearHistory,
    announce,
    playSpeech
  } = useApp();

  const [backendTesting, setBackendTesting] = useState(false);
  const [backendStatus, setBackendStatus] = useState(null); // 'online' | 'offline'

  const handleTextSizeChange = (size) => {
    updateSetting('textSize', size);
    announce(`Text size set to ${size}`);
  };

  const handleTestBackend = async () => {
    const url = settings.backendUrl || 'http://localhost:3001';
    setBackendTesting(true);
    setBackendStatus(null);
    announce('Testing connection to backend...');

    try {
      const res = await fetch(`${url.replace(/\/+$/, '')}/api/health`, { method: 'GET' });
      if (res.ok) {
        setBackendStatus('online');
        announce('Backend server is online and connected.');
        playSpeech('Backend server connected successfully.', 'settings');
      } else {
        setBackendStatus('offline');
        announce('Backend server returned an error status.');
      }
    } catch (e) {
      setBackendStatus('offline');
      announce('Could not reach backend server.');
    } finally {
      setBackendTesting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#204C3A] tracking-tight">
          Accessibility Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#535E56] font-medium">
          Personalize text size, speech rates, contrast, and visual AI options
        </p>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. APPEARANCE SETTINGS */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-white border-2 border-[#DDD8CB] rounded-3xl p-5 sm:p-6 shadow-card space-y-5" aria-labelledby="appearance-heading">
        <div className="flex items-center gap-2 pb-3 border-b border-[#EFECE2]">
          <Eye size={20} className="text-[#204C3A]" />
          <h2 id="appearance-heading" className="text-base font-black text-[#202821]">
            Appearance &amp; Display
          </h2>
        </div>

        {/* Text Size Scaling */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-[#535E56] block">
            Text Size Scaling
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'standard', label: 'Standard (100%)' },
              { id: 'large', label: 'Large (115%)' },
              { id: 'xl', label: 'Extra Large (130%)' }
            ].map(({ id, label }) => {
              const isSelected = settings.textSize === id;
              return (
                <button
                  key={id}
                  onClick={() => handleTextSizeChange(id)}
                  aria-pressed={isSelected}
                  className={`min-h-[48px] px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-[#204C3A] text-white border-[#204C3A] shadow-xs'
                      : 'bg-[#F7F5EE] text-[#202821] border-[#DDD8CB] hover:bg-[#EFECE2]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* High Contrast Mode */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <span className="text-sm font-bold text-[#202821] block">
              High Contrast Mode
            </span>
            <span className="text-xs text-[#535E56]">
              Maximizes text edge contrast to pure black-on-white.
            </span>
          </div>
          <button
            role="switch"
            aria-checked={settings.highContrast}
            onClick={() => {
              const val = !settings.highContrast;
              updateSetting('highContrast', val);
              announce(`High contrast ${val ? 'enabled' : 'disabled'}`);
            }}
            className={`w-14 h-8 rounded-full p-1 transition-colors ${
              settings.highContrast ? 'bg-[#204C3A]' : 'bg-[#DDD8CB]'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white transition-transform ${
                settings.highContrast ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Reduced Motion */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <span className="text-sm font-bold text-[#202821] block">
              Reduced Motion
            </span>
            <span className="text-xs text-[#535E56]">
              Silences interface animations and transition effects.
            </span>
          </div>
          <button
            role="switch"
            aria-checked={settings.reducedMotion}
            onClick={() => {
              const val = !settings.reducedMotion;
              updateSetting('reducedMotion', val);
              announce(`Reduced motion ${val ? 'enabled' : 'disabled'}`);
            }}
            className={`w-14 h-8 rounded-full p-1 transition-colors ${
              settings.reducedMotion ? 'bg-[#204C3A]' : 'bg-[#DDD8CB]'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white transition-transform ${
                settings.reducedMotion ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. SPEECH & VOICE SETTINGS */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-white border-2 border-[#DDD8CB] rounded-3xl p-5 sm:p-6 shadow-card space-y-5" aria-labelledby="speech-heading">
        <div className="flex items-center gap-2 pb-3 border-b border-[#EFECE2]">
          <Volume2 size={20} className="text-[#204C3A]" />
          <h2 id="speech-heading" className="text-base font-black text-[#202821]">
            Speech &amp; Audio Feedback
          </h2>
        </div>

        {/* Speech Speed */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-[#535E56] block">
            Speech Rate: {settings.speechRate || 1.0}x
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {[0.75, 1.0, 1.25, 1.5, 1.75].map((rate) => {
              const isSelected = (settings.speechRate || 1.0) === rate;
              return (
                <button
                  key={rate}
                  onClick={() => {
                    updateSetting('speechRate', rate);
                    announce(`Speech rate set to ${rate}x`);
                    playSpeech(`Speech speed is now ${rate}x`, 'settings');
                  }}
                  aria-pressed={isSelected}
                  className={`min-h-[44px] rounded-xl text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-[#204C3A] text-white border-[#204C3A]'
                      : 'bg-[#F7F5EE] text-[#202821] border-[#DDD8CB]'
                  }`}
                >
                  {rate}x
                </button>
              );
            })}
          </div>
        </div>

        {/* Preferred Language */}
        <div className="space-y-2 pt-2">
          <label htmlFor="settingsLang" className="text-xs font-black uppercase tracking-wider text-[#535E56] block">
            Preferred Audio Language
          </label>
          <select
            id="settingsLang"
            value={settings.preferredLanguage || 'en'}
            onChange={(e) => {
              updateSetting('preferredLanguage', e.target.value);
              announce(`Language set to ${e.target.value}`);
            }}
            className="w-full min-h-[48px] bg-[#F7F5EE] border-2 border-[#DDD8CB] focus:border-[#204C3A] rounded-xl px-4 text-sm font-bold text-[#202821]"
          >
            <option value="en">English (US/UK)</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="gu">ગુજરાતી (Gujarati)</option>
          </select>
        </div>

        {/* Audio First Toggle */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <span className="text-sm font-bold text-[#202821] block">
              Audio-First Announcements
            </span>
            <span className="text-xs text-[#535E56]">
              Automatically reads scene descriptions and OCR scans aloud.
            </span>
          </div>
          <button
            role="switch"
            aria-checked={settings.audioFirst}
            onClick={() => {
              const val = !settings.audioFirst;
              updateSetting('audioFirst', val);
              announce(`Audio-first ${val ? 'enabled' : 'disabled'}`);
            }}
            className={`w-14 h-8 rounded-full p-1 transition-colors ${
              settings.audioFirst ? 'bg-[#204C3A]' : 'bg-[#DDD8CB]'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white transition-transform ${
                settings.audioFirst ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. BACKEND & CLOUD SERVICE */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-white border-2 border-[#DDD8CB] rounded-3xl p-5 sm:p-6 shadow-card space-y-4" aria-labelledby="backend-heading">
        <div className="flex items-center gap-2 pb-3 border-b border-[#EFECE2]">
          <Server size={20} className="text-[#204C3A]" />
          <h2 id="backend-heading" className="text-base font-black text-[#202821]">
            AI Backend Service (Render / Local)
          </h2>
        </div>

        <p className="text-xs text-[#535E56]">
          Local navigation and OCR run 100% offline. The backend service is only queried for deep conversational questions with Gemini 1.5 Flash.
        </p>

        <div className="space-y-2">
          <label htmlFor="backendUrlInput" className="text-xs font-black uppercase tracking-wider text-[#535E56] block">
            Backend Endpoint URL
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="backendUrlInput"
              type="text"
              value={settings.backendUrl || ''}
              onChange={(e) => updateSetting('backendUrl', e.target.value)}
              placeholder="e.g., https://avis-backend.onrender.com or http://localhost:3001"
              className="flex-1 min-h-[48px] bg-[#F7F5EE] border-2 border-[#DDD8CB] focus:border-[#204C3A] rounded-xl px-4 text-xs font-mono text-[#202821]"
            />
            <button
              onClick={handleTestBackend}
              disabled={backendTesting}
              className="min-h-[48px] px-5 bg-[#204C3A] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shrink-0"
            >
              {backendTesting ? <Loader2 size={16} className="animate-spin" /> : null}
              <span>Test Connection</span>
            </button>
          </div>
        </div>

        {backendStatus && (
          <div
            className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold ${
              backendStatus === 'online'
                ? 'bg-[#E8F5E9] border-[#A5D6A7] text-[#1B5E20]'
                : 'bg-[#FDF1F1] border-[#EF9A9A] text-[#A62C2C]'
            }`}
          >
            {backendStatus === 'online' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            <span>
              {backendStatus === 'online'
                ? 'Backend service is online and verified!'
                : 'Could not connect to backend at this URL.'}
            </span>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. PRIVACY & DATA RESET */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-[#EFECE2] border-2 border-[#DDD8CB] rounded-3xl p-5 sm:p-6 space-y-4" aria-labelledby="privacy-heading">
        <div className="flex items-center gap-2 pb-3 border-b border-[#DDD8CB]">
          <Shield size={20} className="text-[#204C3A]" />
          <h2 id="privacy-heading" className="text-base font-black text-[#202821]">
            Privacy &amp; Data Control
          </h2>
        </div>

        <p className="text-xs text-[#535E56]">
          Avis does not track users, store persistent identity cookies, or retain personal data. Your activity history is saved strictly inside your browser's local memory.
        </p>

        <button
          onClick={() => {
            if (window.confirm('Clear all saved activity history?')) {
              clearHistory();
              announce('Activity history cleared.');
            }
          }}
          className="min-h-[48px] px-4 bg-white border border-[#A62C2C] text-[#A62C2C] hover:bg-[#FDF1F1] rounded-xl font-bold text-xs flex items-center gap-2 transition-colors"
        >
          <Trash2 size={16} />
          <span>Clear Local History Cache</span>
        </button>
      </section>
    </div>
  );
}
