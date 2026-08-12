import React from 'react';

const MapLegend = ({ className = '' }) => {
  return (
    <div className={`flex flex-wrap items-center gap-3 text-xs text-civic-muted bg-white/95 backdrop-blur-xs border border-civic-border px-3 py-1.5 rounded-lg shadow-xs ${className}`}>
      <span className="font-bold text-[#10213F] text-[11px] uppercase tracking-wider">Legend:</span>
      <div className="flex flex-wrap items-center gap-3 text-[11px]">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span> High Priority
        </span>
        <span className="inline-flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Medium Priority
        </span>
        <span className="inline-flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Low / Pending
        </span>
        <span className="inline-flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Resolved
        </span>
      </div>
    </div>
  );
};

export default MapLegend;
