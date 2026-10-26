import React from 'react';
import {
  Eye,
  FileText,
  Mic,
  Clock,
  Camera,
  ShieldCheck,
  Volume2,
  Sliders,
  ArrowRight,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function HomeView() {
  const { navigateTo, playSpeech, stopSpeech } = useApp();

  const handleStartVision = () => {
    stopSpeech();
    navigateTo('vision');
  };

  const shortcuts = [
    {
      id: 'vision',
      title: 'Describe Scene',
      description: 'Real-time on-device obstacle detection & AI scene understanding',
      icon: Eye,
      tag: 'Edge Vision'
    },
    {
      id: 'reader',
      title: 'Read Text',
      description: 'Scan printed documents, signs, and labels aloud with instant OCR',
      icon: FileText,
      tag: 'On-Device OCR'
    },
    {
      id: 'assistant',
      title: 'Voice Assistant',
      description: 'Speak natural hands-free questions about your surroundings',
      icon: Mic,
      tag: 'Hands-Free'
    },
    {
      id: 'activity',
      title: 'Recent Activity',
      description: 'Review your previously read texts, descriptions, and saved items',
      icon: Clock,
      tag: 'Saved'
    }
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* ------------------------------------------------------------- */}
      {/* HERO & WELCOME SECTION */}
      {/* ------------------------------------------------------------- */}
      <section
        aria-labelledby="hero-title"
        className="bg-[#EFECE2] border-2 border-[#DDD8CB] rounded-3xl p-6 sm:p-8 lg:p-10 shadow-card relative overflow-hidden"
      >
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E9EFE5] text-[#204C3A] text-xs font-black tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-[#204C3A]" />
            Accessible AI Assistant
          </div>

          <h1
            id="hero-title"
            className="text-fluid-h1 font-black tracking-tight text-[#204C3A] leading-[1.15]"
          >
            Your world, made easier to understand.
          </h1>

          <p className="text-fluid-body text-[#535E56] font-medium leading-relaxed">
            Describe what you see, read printed text, and navigate your surroundings using high-contrast on-device AI and spoken audio feedback.
          </p>

          {/* PRIMARY ACTION: START VISION */}
          <div className="pt-2">
            <button
              onClick={handleStartVision}
              aria-label="Start Vision. Launches live camera for real-time obstacle and scene detection."
              className="w-full sm:w-auto min-h-[64px] px-8 bg-[#204C3A] hover:bg-[#163A2C] active:scale-[0.98] text-white font-black text-lg rounded-2xl flex items-center justify-center gap-3.5 shadow-elevated transition-all focus-visible:ring-4 focus-visible:ring-[#204C3A]"
            >
              <Camera size={26} />
              <span>START VISION</span>
              <ArrowRight size={22} className="opacity-80" />
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* FEATURE SHORTCUTS GRID */}
      {/* ------------------------------------------------------------- */}
      <section aria-labelledby="features-title">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2
            id="features-title"
            className="text-xs font-black uppercase tracking-wider text-[#535E56]"
          >
            Core Capabilities
          </h2>
          <span className="text-xs font-bold text-[#204C3A]">
            4 Modules Ready
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {shortcuts.map(({ id, title, description, icon: Icon, tag }) => (
            <button
              key={id}
              onClick={() => navigateTo(id)}
              aria-label={`Open ${title}: ${description}`}
              className="bg-[#FFFFFF] hover:bg-[#FBF9F4] border-2 border-[#DDD8CB] hover:border-[#204C3A] rounded-2xl p-5 text-left transition-all shadow-subtle flex flex-col justify-between group focus-visible:ring-2 focus-visible:ring-[#204C3A]"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-[#E9EFE5] text-[#204C3A] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Icon size={24} />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EFECE2] text-[#535E56]">
                    {tag}
                  </span>
                </div>

                <h3 className="text-lg font-black text-[#202821] group-hover:text-[#204C3A] transition-colors">
                  {title}
                </h3>
                <p className="text-xs text-[#535E56] font-medium mt-1 leading-normal">
                  {description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#EFECE2] flex items-center justify-between text-xs font-bold text-[#204C3A]">
                <span>Launch tool</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* TRUST, PRIVACY & GUIDANCE CARD */}
      {/* ------------------------------------------------------------- */}
      <section
        aria-label="Guidance and Trust Information"
        className="bg-[#E9EFE5] border border-[#A8B9A0] rounded-2xl p-4 sm:p-5 text-xs text-[#202821] space-y-2 shadow-sm"
      >
        <div className="flex items-center gap-2 font-black text-sm text-[#204C3A]">
          <ShieldCheck size={18} />
          <span>Trust & Assistive Operation Guidelines</span>
        </div>

        <ul className="space-y-1.5 text-[#535E56] font-medium list-disc list-inside">
          <li><strong>Zero Cloud Lag</strong>: Navigation obstacle detection and document OCR run 100% locally on your device.</li>
          <li><strong>Instant Speech Silence</strong>: Press the red <kbd className="bg-white px-1.5 py-0.5 rounded border border-[#DDD8CB] font-bold text-[#202821]">Stop</kbd> button or say <em>"Stop speaking"</em> anytime to cancel audio output.</li>
          <li><strong>Safety Notice</strong>: Camera detection covers forward field of view; always use your primary white cane or guide dog for steps and low drop-offs.</li>
        </ul>
      </section>
    </div>
  );
}
