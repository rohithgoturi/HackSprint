import React, { useMemo } from 'react';
import { useCivic } from '../../context/CivicContext';
import { BarChart3, Building2, AlertTriangle, CheckCircle2 } from 'lucide-react';

const AdminAnalytics = () => {
  const { issues } = useCivic();

  const totalCount = issues.length || 1;

  // Breakdown by Category
  const categoryStats = useMemo(() => {
    const counts = {};
    issues.forEach(i => {
      const cat = i.category || 'Uncategorized';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count, percent: Math.round((count / totalCount) * 100) }))
      .sort((a, b) => b.count - a.count);
  }, [issues, totalCount]);

  // Breakdown by Priority
  const priorityStats = useMemo(() => {
    const counts = { High: 0, Medium: 0, Low: 0, Other: 0 };
    issues.forEach(i => {
      if (i.priority === 'High' || i.priority === 'Critical') counts.High += 1;
      else if (i.priority === 'Medium') counts.Medium += 1;
      else if (i.priority === 'Low') counts.Low += 1;
      else counts.Other += 1;
    });
    return [
      { name: 'High Priority', count: counts.High, color: 'bg-red-600', text: 'text-red-700' },
      { name: 'Medium Priority', count: counts.Medium, color: 'bg-amber-500', text: 'text-amber-700' },
      { name: 'Low Priority', count: counts.Low, color: 'bg-blue-600', text: 'text-blue-700' },
    ];
  }, [issues]);

  // Breakdown by Status
  const statusStats = useMemo(() => {
    const counts = {};
    issues.forEach(i => {
      const st = i.status || 'Reported';
      counts[st] = (counts[st] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count, percent: Math.round((count / totalCount) * 100) }))
      .sort((a, b) => b.count - a.count);
  }, [issues, totalCount]);

  // Breakdown by Ward (Ward Insights)
  const wardStats = useMemo(() => {
    const counts = {};
    issues.forEach(i => {
      const w = i.ward || 'Unknown Ward';
      counts[w] = (counts[w] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count, percent: Math.round((count / totalCount) * 100) }))
      .sort((a, b) => b.count - a.count);
  }, [issues, totalCount]);

  return (
    <div className="space-y-6 font-sans text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-civic-border pb-4">
        <div>
          <span className="text-[10px] font-bold text-civic-action uppercase tracking-widest block font-mono">
            MUNICIPAL STATISTICAL AUDIT
          </span>
          <h2 className="text-xl font-extrabold text-[#10213F] tracking-tight mt-0.5">
            CIVIC ANALYTICS & WARD INSIGHTS
          </h2>
          <p className="text-xs text-civic-muted mt-1 leading-relaxed">
            Derived operational metrics from active citizen reports across categories and municipal wards.
          </p>
        </div>

        <div className="text-xs text-[#10213F] font-bold bg-white border border-civic-border px-3.5 py-2 rounded-lg shadow-xs">
          Total Sample Dataset: <span className="text-civic-action font-mono">{issues.length} Reports</span>
        </div>
      </div>

      {/* Main Grid of Analytics Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* ISSUES BY CATEGORY */}
        <div className="bg-white border border-civic-border rounded-xl p-6 shadow-civic-subtle space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-[#10213F] uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-civic-action" /> Issues by Category
            </h3>
            <span className="text-[10px] font-mono text-civic-muted font-bold">Category Count</span>
          </div>

          <div className="space-y-3">
            {categoryStats.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#10213F]">{item.name}</span>
                  <span className="font-mono font-bold text-slate-600">{item.count} issues ({item.percent}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                  <div 
                    className="bg-civic-action h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(item.percent, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ISSUES BY PRIORITY */}
        <div className="bg-white border border-civic-border rounded-xl p-6 shadow-civic-subtle space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-[#10213F] uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Issues by Priority
            </h3>
            <span className="text-[10px] font-mono text-civic-muted font-bold">Severity Distribution</span>
          </div>

          <div className="space-y-4">
            {priorityStats.map((item) => {
              const pct = Math.round((item.count / totalCount) * 100);
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className={`font-bold ${item.text}`}>{item.name}</span>
                    <span className="font-mono font-bold text-slate-600">{item.count} reports ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                    <div 
                      className={`${item.color} h-full rounded-full transition-all duration-300`}
                      style={{ width: `${Math.max(pct, 3)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* WARD INSIGHTS (ISSUES BY WARD) */}
        <div className="bg-white border border-civic-border rounded-xl p-6 shadow-civic-subtle space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-[#10213F] uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-civic-action" /> Issues by Ward (Ward Insights)
            </h3>
            <span className="text-[10px] font-mono text-civic-muted font-bold">Sorted Descending</span>
          </div>

          <div className="space-y-3">
            {wardStats.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <span className="font-bold text-[#10213F]">{item.name}</span>
                <span className="font-mono font-bold text-civic-action bg-white border border-slate-200 px-2.5 py-0.5 rounded">
                  {item.count} issues
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ISSUES BY STATUS */}
        <div className="bg-white border border-civic-border rounded-xl p-6 shadow-civic-subtle space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-[#10213F] uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Lifecycle Status Breakdown
            </h3>
            <span className="text-[10px] font-mono text-civic-muted font-bold">Workflow State</span>
          </div>

          <div className="space-y-3">
            {statusStats.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#10213F]">{item.name}</span>
                  <span className="font-mono font-bold text-slate-600">{item.count} ({item.percent}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                  <div 
                    className="bg-[#10213F] h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(item.percent, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminAnalytics;
