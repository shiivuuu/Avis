import React from 'react';
import {
  HelpCircle,
  Keyboard,
  Mic,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  BookOpen
} from 'lucide-react';

export default function HelpView() {
  const shortcuts = [
    { key: 'H', action: 'Go to Home page' },
    { key: 'V', action: 'Open AI Vision workspace' },
    { key: 'R', action: 'Open Smart Reader' },
    { key: 'A', action: 'Open Voice Assistant' },
    { key: 'C', action: 'Open Recent Activity' },
    { key: 'S', action: 'Open Accessibility Settings' },
    { key: '?', action: 'Open Privacy & Help' },
    { key: 'Space', action: 'Stop Speech immediately' }
  ];

  const voiceCommands = [
    { phrase: '“Describe my surroundings”', purpose: 'Triggers on-device visual scene analysis' },
    { phrase: '“Read this text”', purpose: 'Scans documents or labels and reads them aloud' },
    { phrase: '“Repeat the answer”', purpose: 'Replays the last spoken audio utterance' },
    { phrase: '“Speak slower” / “Speak faster”', purpose: 'Adjusts speech playback speed by 0.25x' },
    { phrase: '“Stop speaking”', purpose: 'Immediately cancels active speech audio' },
    { phrase: '“Capture another image”', purpose: 'Snaps a fresh viewpoint for analysis' },
    { phrase: '“Open accessibility settings”', purpose: 'Opens text size and voice preferences' },
    { phrase: '“Help”', purpose: 'Speaks available voice commands' }
  ];

  return (
    <div className="space-y-8 max-w-3xl mx-auto animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#204C3A] tracking-tight">
          Privacy &amp; Help Center
        </h1>
        <p className="text-xs sm:text-sm text-[#535E56] font-medium">
          Operational guidelines, accessibility keyboard shortcuts, and safety notices
        </p>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. CRITICAL SAFETY NOTICE */}
      {/* ------------------------------------------------------------- */}
      <section
        aria-label="Critical Safety Notice"
        className="bg-[#FFF9E6] border-2 border-[#FFE082] rounded-3xl p-5 sm:p-6 shadow-sm space-y-3"
      >
        <div className="flex items-center gap-2 font-black text-sm text-[#855A0B]">
          <AlertTriangle size={20} className="shrink-0" />
          <span>Non-Negotiable Safety Disclosure</span>
        </div>

        <div className="text-xs sm:text-sm text-[#855A0B] space-y-2 font-medium leading-relaxed">
          <p>
            <strong>Avis is an assistive aid, not a guarantee of absolute safety.</strong> Camera-based 2D computer vision evaluates angular field of view and does not provide physical 3D metric depth or distance measurements.
          </p>
          <p>
            Generic on-device object detection <strong>does not guarantee detection of overhead hazards</strong> (such as low tree branches, protruding signboards, or wires) or downward drop-offs (stairs without risers, open platform edges, pits).
          </p>
          <p className="font-bold underline">
            Users must always use their white cane or guide dog as their primary mobility aid.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. KEYBOARD SHORTCUTS GUIDE */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-white border-2 border-[#DDD8CB] rounded-3xl p-5 sm:p-6 shadow-card space-y-4" aria-labelledby="keyboard-heading">
        <div className="flex items-center gap-2 pb-3 border-b border-[#EFECE2]">
          <Keyboard size={20} className="text-[#204C3A]" />
          <h2 id="keyboard-heading" className="text-base font-black text-[#202821]">
            Keyboard Navigation Shortcuts
          </h2>
        </div>

        <p className="text-xs text-[#535E56]">
          Navigate rapidly through Avis using single-key shortcuts from anywhere within the application.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {shortcuts.map(({ key, action }) => (
            <div
              key={key}
              className="flex items-center justify-between p-3 rounded-xl bg-[#F7F5EE] border border-[#DDD8CB] text-xs font-bold"
            >
              <span className="text-[#202821]">{action}</span>
              <kbd className="px-2.5 py-1 rounded-md bg-white border border-[#DDD8CB] font-mono text-[#204C3A] text-xs shadow-2xs">
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. VOICE COMMANDS REFERENCE */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-white border-2 border-[#DDD8CB] rounded-3xl p-5 sm:p-6 shadow-card space-y-4" aria-labelledby="voice-heading">
        <div className="flex items-center gap-2 pb-3 border-b border-[#EFECE2]">
          <Mic size={20} className="text-[#204C3A]" />
          <h2 id="voice-heading" className="text-base font-black text-[#202821]">
            Hands-Free Voice Commands
          </h2>
        </div>

        <div className="space-y-2">
          {voiceCommands.map(({ phrase, purpose }) => (
            <div
              key={phrase}
              className="p-3 rounded-xl bg-[#F7F5EE] border border-[#DDD8CB] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
            >
              <span className="font-bold text-[#204C3A]">{phrase}</span>
              <span className="text-[#535E56] font-medium">{purpose}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. DATA PRIVACY & EDGE ARCHITECTURE */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-[#E9EFE5] border-2 border-[#A8B9A0] rounded-3xl p-5 sm:p-6 shadow-card space-y-3" aria-labelledby="privacy-heading">
        <div className="flex items-center gap-2 pb-3 border-b border-[#A8B9A0]">
          <ShieldCheck size={20} className="text-[#204C3A]" />
          <h2 id="privacy-heading" className="text-base font-black text-[#204C3A]">
            Privacy &amp; Security Principles
          </h2>
        </div>

        <ul className="space-y-2 text-xs sm:text-sm text-[#202821] font-medium leading-relaxed list-disc list-inside">
          <li><strong>Zero Video Telemetry</strong>: Video frames from your camera stream are analyzed in volatile memory on your device using TensorFlow.js and are never saved or sent to external servers.</li>
          <li><strong>Local Document Processing</strong>: Smart Reader OCR uses in-browser Tesseract.js workers to recognize text without cloud uploads.</li>
          <li><strong>Protected Secrets</strong>: Multimodal API keys reside securely on the backend server. The client never stores or exposes private credentials.</li>
        </ul>
      </section>
    </div>
  );
}
