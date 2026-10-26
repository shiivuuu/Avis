import React from 'react';
import { Camera, Mic, Cloud, Compass, FileText, Sparkles } from 'lucide-react';

export default function StatusHeader({
  currentMode,
  onModeChange,
  cameraActive,
  micActive,
  backendConnected
}) {
  const modes = [
    { id: 'navigation', label: 'Navigation', icon: Compass },
    { id: 'document', label: 'Document', icon: FileText },
    { id: 'assistant', label: 'AI Assistant', icon: Sparkles },
  ];

  return (
    <header className="bg-[#F4EFE6] border-b border-[#DDD5C7] shadow-sm px-4 py-3 rounded-b-2xl">
      <div className="max-w-md mx-auto">
        {/* Top bar with branding and status badges */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-wider text-[#1B4332] flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#1B4332] inline-block"></span>
              AVIS
            </h1>
            <p className="text-xs font-medium text-[#536257]">Assistive AI Vision System</p>
          </div>

          {/* Status Badges */}
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${
                cameraActive ? 'bg-[#D8F3DC] text-[#1B4332]' : 'bg-[#E5DFD3] text-[#717171]'
              }`}
              title={`Camera ${cameraActive ? 'Active' : 'Idle'}`}
              aria-label={`Camera ${cameraActive ? 'active' : 'idle'}`}
            >
              <Camera size={14} />
              <span className={`w-1.5 h-1.5 rounded-full ${cameraActive ? 'bg-[#157347]' : 'bg-gray-400'}`}></span>
            </span>

            <span
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${
                micActive ? 'bg-[#D8F3DC] text-[#1B4332]' : 'bg-[#E5DFD3] text-[#717171]'
              }`}
              title={`Microphone ${micActive ? 'Active' : 'Idle'}`}
              aria-label={`Microphone ${micActive ? 'active' : 'idle'}`}
            >
              <Mic size={14} />
              <span className={`w-1.5 h-1.5 rounded-full ${micActive ? 'bg-[#157347]' : 'bg-gray-400'}`}></span>
            </span>

            <span
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${
                backendConnected ? 'bg-[#D8F3DC] text-[#1B4332]' : 'bg-[#E5DFD3] text-[#717171]'
              }`}
              title={`Cloud AI ${backendConnected ? 'Connected' : 'Offline'}`}
              aria-label={`Cloud AI ${backendConnected ? 'connected' : 'offline'}`}
            >
              <Cloud size={14} />
              <span className={`w-1.5 h-1.5 rounded-full ${backendConnected ? 'bg-[#157347]' : 'bg-gray-400'}`}></span>
            </span>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <nav className="mt-3 grid grid-cols-3 gap-1 bg-[#FDFBF7] p-1 rounded-xl border border-[#DDD5C7]" role="tablist">
          {modes.map(({ id, label, icon: Icon }) => {
            const isSelected = currentMode === id;
            return (
              <button
                key={id}
                role="tab"
                aria-selected={isSelected}
                onClick={() => onModeChange(id)}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-sm font-bold transition-colors ${
                  isSelected
                    ? 'bg-[#1B4332] text-white shadow-sm'
                    : 'text-[#2E3A33] hover:bg-[#F4EFE6]'
                }`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
