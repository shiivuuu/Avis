import React from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Volume2,
  Gauge
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function AudioPlayer({
  text = '',
  source = '',
  className = '',
  onPlayOverride,
  showSpeedControls = true
}) {
  const {
    audioState,
    playSpeech,
    pauseSpeech,
    resumeSpeech,
    stopSpeech,
    repeatSpeech,
    settings,
    updateSetting
  } = useApp();

  const isCurrentText = audioState.text && audioState.text === text.trim();
  const isPlaying = isCurrentText && audioState.isPlaying;
  const isPaused = isCurrentText && audioState.isPaused;

  const handlePlayToggle = () => {
    if (isPlaying) {
      pauseSpeech();
    } else if (isPaused) {
      resumeSpeech();
    } else {
      if (onPlayOverride) {
        onPlayOverride();
      } else {
        playSpeech(text, source);
      }
    }
  };

  const handleSpeedChange = (speed) => {
    updateSetting('speechRate', speed);
    // If currently playing, restart with new speed
    if (isPlaying || isPaused) {
      playSpeech(text, source);
    }
  };

  const speeds = [0.75, 1.0, 1.25, 1.5];

  if (!text && !audioState.text) return null;

  return (
    <div
      role="region"
      aria-label="Speech Player Controls"
      className={`bg-[#EFECE2] border-2 border-[#DDD8CB] rounded-2xl p-4 shadow-sm space-y-3 ${className}`}
    >
      {/* Status & Source Label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="text-[#204C3A]" size={20} />
          <span className="text-xs font-black uppercase tracking-wider text-[#204C3A]">
            {isPlaying ? 'Speaking aloud' : isPaused ? 'Speech paused' : 'Voice Reader Ready'}
          </span>
        </div>

        {/* Live Status Pill */}
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
            isPlaying
              ? 'bg-[#E8F5E9] text-[#1B5E20] border border-[#A5D6A7]'
              : isPaused
              ? 'bg-[#FFF9E6] text-[#855A0B] border border-[#FFE082]'
              : 'bg-[#DDD8CB] text-[#535E56]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isPlaying ? 'bg-[#204C3A] animate-ping' : isPaused ? 'bg-[#855A0B]' : 'bg-[#717D74]'
            }`}
          />
          {isPlaying ? 'Active' : isPaused ? 'Paused' : 'Idle'}
        </span>
      </div>

      {/* Primary Play/Pause/Stop Buttons */}
      <div className="grid grid-cols-3 gap-2">
        {/* Play/Pause Button */}
        <button
          onClick={handlePlayToggle}
          aria-label={isPlaying ? 'Pause speech' : isPaused ? 'Resume speech' : 'Play text aloud'}
          className="min-h-[52px] bg-[#204C3A] active:bg-[#163A2C] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-[#204C3A]"
        >
          {isPlaying ? (
            <>
              <Pause size={18} fill="white" />
              <span>Pause</span>
            </>
          ) : isPaused ? (
            <>
              <Play size={18} fill="white" />
              <span>Resume</span>
            </>
          ) : (
            <>
              <Play size={18} fill="white" />
              <span>Play</span>
            </>
          )}
        </button>

        {/* Stop Button */}
        <button
          onClick={stopSpeech}
          disabled={!isPlaying && !isPaused}
          aria-label="Stop speech immediately"
          className="min-h-[52px] bg-[#A62C2C] active:bg-[#831F1F] disabled:opacity-40 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-[#A62C2C]"
        >
          <Square size={18} fill="white" />
          <span>Stop</span>
        </button>

        {/* Repeat Button */}
        <button
          onClick={repeatSpeech}
          aria-label="Repeat speech from beginning"
          className="min-h-[52px] bg-[#F7F5EE] border-2 border-[#204C3A] text-[#204C3A] active:bg-[#EFECE2] font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-[#204C3A]"
        >
          <RotateCcw size={18} />
          <span>Repeat</span>
        </button>
      </div>

      {/* Speed Controls */}
      {showSpeedControls && (
        <div className="pt-2 border-t border-[#DDD8CB] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[#535E56] font-bold">
            <Gauge size={14} />
            <span>Speed:</span>
          </div>

          <div className="flex items-center gap-1" role="group" aria-label="Speech Speed Options">
            {speeds.map((s) => {
              const isSelected = (settings.speechRate || 1.0) === s;
              return (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  aria-pressed={isSelected}
                  className={`min-h-[36px] px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                    isSelected
                      ? 'bg-[#204C3A] text-white shadow-xs'
                      : 'bg-[#F7F5EE] text-[#535E56] hover:bg-[#E5DFD1] border border-[#DDD8CB]'
                  }`}
                >
                  {s}x
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
