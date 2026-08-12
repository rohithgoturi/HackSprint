import React from 'react';
import { Settings, Shield, Sliders } from 'lucide-react';

const AdminSettings = () => {
  return (
    <div className="space-y-6 font-sans text-left">
      {/* Header */}
      <div className="border-b border-civic-border pb-4">
        <span className="text-[10px] font-bold text-civic-action uppercase tracking-widest block font-mono">
          SYSTEM CONFIGURATION
        </span>
        <h2 className="text-xl font-extrabold text-[#10213F] tracking-tight mt-0.5">
          ADMIN SETTINGS
        </h2>
        <p className="text-xs text-civic-muted mt-1 leading-relaxed">
          Administrative configuration will be available in a future release.
        </p>
      </div>

      {/* Placeholder Card */}
      <div className="bg-white border border-civic-border rounded-xl p-8 max-w-2xl shadow-civic-subtle space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#10213F]">Municipal System Parameters</h3>
            <p className="text-xs text-civic-muted">Role permissions, service SLA thresholds, and department escalation matrices.</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-civic-muted leading-relaxed">
          Administrative configuration will be available in a future release when backend service integration and municipal authentication models are deployed.
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
