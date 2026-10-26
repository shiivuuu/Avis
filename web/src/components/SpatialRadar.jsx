import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function SpatialRadar({ activeCues = [] }) {
  const leftCues = activeCues.filter(c => c.direction === 'LEFT');
  const centerCues = activeCues.filter(c => c.direction === 'CENTER');
  const rightCues = activeCues.filter(c => c.direction === 'RIGHT');

  const hasCenter = centerCues.length > 0;
  const hasLeft = leftCues.length > 0;
  const hasRight = rightCues.length > 0;

  const radarSummary = [
    hasCenter ? `Obstacle ahead: ${centerCues[0].label}.` : '',
    hasLeft ? `Object on left: ${leftCues[0].label}.` : '',
    hasRight ? `Object on right: ${rightCues[0].label}.` : '',
    !hasCenter && !hasLeft && !hasRight ? 'Path clear ahead.' : ''
  ].filter(Boolean).join(' ');

  return (
    <section
      aria-label="Spatial Field of View Radar"
      className="bg-[#F4EFE6] border border-[#DDD5C7] rounded-2xl p-3.5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-black tracking-wider uppercase text-[#1B4332]">
          Spatial Radar
        </h2>
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            hasCenter ? 'bg-[#FBE8E5] text-[#931A08]' : 'bg-[#D8F3DC] text-[#1B4332]'
          }`}
        >
          {activeCues.length === 0 ? 'CLEAR' : `${activeCues.length} DETECTED`}
        </span>
      </div>

      {/* 3 Zone Grid */}
      <div className="grid grid-cols-3 gap-2" aria-live="polite">
        {/* Left Zone */}
        <ZoneCard
          title="LEFT"
          cues={leftCues}
          isUrgent={false}
          hasObstacle={hasLeft}
        />

        {/* Ahead Zone */}
        <ZoneCard
          title="AHEAD"
          cues={centerCues}
          isUrgent={true}
          hasObstacle={hasCenter}
        />

        {/* Right Zone */}
        <ZoneCard
          title="RIGHT"
          cues={rightCues}
          isUrgent={false}
          hasObstacle={hasRight}
        />
      </div>

      {/* Screen reader summary announcement */}
      <div className="sr-only" aria-live="assertive">
        {radarSummary}
      </div>
    </section>
  );
}

function ZoneCard({ title, cues, isUrgent, hasObstacle }) {
  const bgClass = hasObstacle
    ? (isUrgent ? 'bg-[#FBE8E5] border-[#931A08] text-[#931A08]' : 'bg-[#FFF3CD] border-[#D4A72C] text-[#856404]')
    : 'bg-[#D8F3DC] border-[#B7E4C7] text-[#1B4332]';

  const labelText = hasObstacle ? cues[0].label : 'Clear';

  return (
    <div
      className={`border-2 rounded-xl p-2.5 text-center flex flex-col items-center justify-center transition-all ${bgClass}`}
    >
      <span className="text-[11px] font-black tracking-wider uppercase mb-1">
        {title}
      </span>
      {hasObstacle ? (
        <AlertTriangle size={18} className="my-0.5 shrink-0" />
      ) : (
        <CheckCircle2 size={18} className="my-0.5 opacity-60 shrink-0" />
      )}
      <span className="text-xs font-bold truncate max-w-full">
        {labelText}
      </span>
    </div>
  );
}
