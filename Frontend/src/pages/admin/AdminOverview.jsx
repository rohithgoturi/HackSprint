import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCivic } from '../../context/CivicContext';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import { 
  FileText, 
  AlertTriangle, 
  Clock, 
  Wrench, 
  CheckCircle2, 
  ChevronRight, 
  ArrowRight, 
  MapPin, 
  Building2,
  Brain
} from 'lucide-react';

const AdminOverview = () => {
  const { issues } = useCivic();
  const navigate = useNavigate();

  // Dynamic calculations from context
  const total = issues.length;
  const open = issues.filter(i => i.status !== 'Resolved').length;
  const highPriority = issues.filter(i => (i.priority === 'High' || i.priority === 'Critical') && i.status !== 'Resolved').length;
  const inProgress = issues.filter(i => i.status === 'In Progress').length;
  const resolved = issues.filter(i => i.status === 'Resolved').length;

  const statCards = [
    {
      label: 'TOTAL REPORTS',
      value: total,
      icon: FileText,
      context: 'Logged in system',
      color: 'text-blue-600 bg-blue-50 border-blue-100'
    },
    {
      label: 'OPEN ISSUES',
      value: open,
      icon: Clock,
      context: 'Pending resolution',
      color: 'text-amber-600 bg-amber-50 border-amber-100'
    },
    {
      label: 'HIGH PRIORITY',
      value: highPriority,
      icon: AlertTriangle,
      context: 'Needs attention',
      color: 'text-red-600 bg-red-50 border-red-100'
    },
    {
      label: 'IN PROGRESS',
      value: inProgress,
      icon: Wrench,
      context: 'Active field work',
      color: 'text-sky-600 bg-sky-50 border-sky-100'
    },
    {
      label: 'RESOLVED',
      value: resolved,
      icon: CheckCircle2,
      context: 'Completed cases',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100'
    }
  ];

  // Latest 8 issues sorted by createdAt newest first
  const recentIssues = [...issues].sort((a, b) => 
    new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  ).slice(0, 8);

  const formatDate = (dateStr) => {
    if (!dateStr) return '12 Aug 2026';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '12 Aug 2026';
    }
  };

  return (
    <div className="space-y-8 font-sans text-left">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-civic-border rounded-xl p-6 shadow-xs">
        <div>
          <span className="text-[10px] font-bold text-civic-action uppercase tracking-widest block font-mono">
            MUNICIPAL OPERATIONS DASHBOARD
          </span>
          <h2 className="text-xl font-extrabold text-[#10213F] tracking-tight mt-0.5">
            CIVIC OPERATIONS OVERVIEW
          </h2>
          <p className="text-xs text-civic-muted mt-1 leading-relaxed max-w-2xl">
            Monitor reported issues, prioritize action and track resolution across the city.
          </p>
        </div>

        <Link to="/admin/issues">
          <button className="bg-[#10213F] hover:bg-[#1A325C] text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer">
            View All Issues <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </Link>
      </div>

      {/* Operational Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div 
              key={card.label} 
              className="bg-white border border-civic-border rounded-xl p-4 shadow-civic-subtle flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-civic-muted uppercase tracking-wider">
                  {card.label}
                </span>
                <div className={`p-1.5 rounded-md border ${card.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <div className="text-2xl font-extrabold text-[#10213F] tracking-tight font-mono">
                  {card.value}
                </div>
                <div className="text-[11px] text-civic-muted font-medium mt-0.5">
                  "{card.context}"
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* RECENT CIVIC ISSUES */}
      <div className="bg-white border border-civic-border rounded-xl shadow-civic-subtle overflow-hidden space-y-4">
        
        {/* Table Header & Quick Action */}
        <div className="p-5 border-b border-civic-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-[#10213F] uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-civic-action" /> Recent Civic Issues
            </h3>
            <p className="text-xs text-civic-muted mt-0.5">
              Latest citizen submissions awaiting triage, assignment, or completion.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/admin/map" className="text-xs font-bold text-civic-action hover:text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-md inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Live Map View
            </Link>
            <Link to="/admin/issues" className="text-xs font-bold text-civic-navy hover:text-civic-action bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-md inline-flex items-center gap-1">
              All Reports ({issues.length})
            </Link>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-civic-border">
            <thead className="bg-slate-50 text-[10px] font-bold text-[#10213F] uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-left">Report ID</th>
                <th scope="col" className="px-6 py-3.5 text-left">Issue</th>
                <th scope="col" className="px-6 py-3.5 text-left">Category</th>
                <th scope="col" className="px-6 py-3.5 text-left">Location / Ward</th>
                <th scope="col" className="px-6 py-3.5 text-left">Priority</th>
                <th scope="col" className="px-6 py-3.5 text-left">Status</th>
                <th scope="col" className="px-6 py-3.5 text-left">Reported</th>
                <th scope="col" className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-civic-border bg-white text-xs text-[#10213F]">
              {recentIssues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-civic-muted">
                    No active issues recorded in the system.
                  </td>
                </tr>
              ) : (
                recentIssues.map((issue) => (
                  <tr 
                    key={issue.id}
                    onClick={() => navigate(`/admin/issues/${issue.id}`)}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-civic-action whitespace-nowrap">
                      {issue.id}
                    </td>
                    <td className="px-6 py-4 font-bold text-[#10213F] max-w-xs truncate">
                      {issue.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-[11px] font-medium text-civic-muted bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                        {issue.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-xs">{issue.ward}</div>
                      <div className="text-[10px] text-civic-muted truncate max-w-[140px]">
                        {issue.location?.address || issue.locationText || 'Pinned Location'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PriorityBadge priority={issue.priority} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={issue.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-civic-muted text-[11px] font-mono">
                      {formatDate(issue.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/issues/${issue.id}`);
                        }}
                        className="bg-slate-100 hover:bg-civic-action hover:text-white text-civic-navy text-[11px] font-bold px-3 py-1.5 rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        View <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Issue Cards View */}
        <div className="md:hidden p-4 space-y-3">
          {recentIssues.length === 0 ? (
            <p className="text-xs text-civic-muted text-center py-6">No issues found.</p>
          ) : (
            recentIssues.map((issue) => (
              <div 
                key={issue.id}
                onClick={() => navigate(`/admin/issues/${issue.id}`)}
                className="bg-slate-50 border border-civic-border rounded-lg p-4 space-y-3 active:bg-blue-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono font-bold text-civic-action text-xs">{issue.id}</span>
                    <h4 className="font-bold text-xs text-[#10213F] mt-0.5">{issue.title}</h4>
                  </div>
                  <StatusBadge status={issue.status} />
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-civic-muted">
                  <span className="font-bold bg-white border border-slate-200 px-2 py-0.5 rounded">{issue.ward}</span>
                  <span>&bull;</span>
                  <span>{issue.category}</span>
                  <span>&bull;</span>
                  <PriorityBadge priority={issue.priority} />
                </div>

                <div className="flex justify-between items-center pt-1 text-[11px] border-t border-slate-200/60">
                  <span className="text-slate-400 font-mono">{formatDate(issue.createdAt)}</span>
                  <span className="text-civic-action font-bold inline-flex items-center gap-0.5">
                    Inspect Issue <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

    </div>
  );
};

export default AdminOverview;
