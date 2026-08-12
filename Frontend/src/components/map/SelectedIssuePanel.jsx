import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StatusBadge from '../StatusBadge';
import PriorityBadge from '../PriorityBadge';
import { MapPin, X, ArrowRight, Brain, Building2, ChevronRight } from 'lucide-react';

const SelectedIssuePanel = ({ issue, onClose, mode = 'public' }) => {
  const navigate = useNavigate();

  if (!issue) return null;

  const trackLink = mode === 'admin' 
    ? `/admin/issues/${issue.id}` 
    : `/track?id=${issue.id}`;

  return (
    <div className="bg-white border border-civic-border rounded-xl shadow-xl p-5 space-y-4 font-sans text-left animate-in fade-in slide-in-from-bottom-3 duration-200 w-full max-w-sm">
      
      {/* Header Bar */}
      <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-2.5">
        <div>
          <span className="font-mono text-[10px] font-extrabold text-civic-action bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
            {issue.id}
          </span>
          <span className="text-[10px] font-bold text-civic-muted uppercase tracking-wider block mt-1">
            {issue.category}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
          title="Close Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Title & Description */}
      <div className="space-y-1.5">
        <h3 className="text-sm font-bold text-[#10213F] leading-snug">
          {issue.title}
        </h3>
        <p className="text-xs text-civic-muted line-clamp-2 leading-relaxed bg-slate-50 border border-slate-200/60 p-2.5 rounded-lg">
          "{issue.description}"
        </p>
      </div>

      {/* Badges & Location */}
      <div className="space-y-2 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={issue.status} />
          <PriorityBadge priority={issue.priority} />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-civic-muted font-medium">
          <MapPin className="w-3.5 h-3.5 text-civic-action flex-shrink-0" />
          <span className="truncate">{issue.ward} &bull; {issue.location?.address || issue.locationText || 'Pinned Coordinates'}</span>
        </div>

        {issue.assignedDepartment && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-700 bg-slate-100 px-2.5 py-1 rounded font-medium">
            <Building2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span className="truncate">Dept: {issue.assignedDepartment}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <button
          onClick={() => navigate(trackLink)}
          className="flex-1 bg-civic-action hover:bg-civic-action-hover text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors inline-flex items-center justify-center gap-1 cursor-pointer shadow-xs"
        >
          {mode === 'admin' ? 'INSPECT ISSUE' : 'TRACK ISSUE'} <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onClose}
          className="bg-slate-100 hover:bg-slate-200 text-civic-navy text-xs font-semibold py-2 px-3 rounded-lg transition-colors cursor-pointer"
        >
          CLOSE
        </button>
      </div>

    </div>
  );
};

export default SelectedIssuePanel;
