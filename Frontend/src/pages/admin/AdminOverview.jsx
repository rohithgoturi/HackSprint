import React, { useEffect } from 'react';
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
  Brain,
  Loader2,
  AlertCircle
} from 'lucide-react';

const AdminOverview = () => {
  const { issues, fetchAdminDashboard, adminStats, loading, error, fetchComplaints } = useCivic();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAdminDashboard();
    fetchComplaints();
  }, [fetchAdminDashboard, fetchComplaints]);

  // Calculations from live backend adminStats or fall back to issues
  const overview = adminStats?.overview;
  const total = overview?.totalComplaints ?? issues.length;
  const open = overview ? (overview.reportedCount + overview.underReviewCount + overview.assignedCount + overview.inProgressCount) : issues.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED' && i.status !== 'VERIFIED').length;
  const highPriority = issues.filter(i => (i.priority === 'HIGH' || i.priority === 'CRITICAL' || i.priority === 'High' || i.priority === 'Critical') && i.status !== 'RESOLVED' && i.status !== 'CLOSED' && i.status !== 'VERIFIED').length;
  const inProgress = overview?.inProgressCount ?? issues.filter(i => i.status === 'IN_PROGRESS' || i.status === 'In Progress').length;
  const resolved = overview ? (overview.resolvedCount + overview.verifiedCount + overview.closedCount) : issues.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED' || i.status === 'VERIFIED').length;

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

  // Latest issues sorted by createdAt newest first
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
        <div className="flex items-center gap-2">
          <Link to="/admin/issues">
            <button className="bg-civic-navy hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs">
              Manage All Reports <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              className="bg-white border border-civic-border rounded-xl p-5 shadow-civic-subtle flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-civic-muted uppercase tracking-wider">
                  {card.label}
                </span>
                <div className={`p-2 rounded-lg border ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3">
                <div className="text-3xl font-black text-[#10213F] tracking-tight">
                  {loading ? '...' : card.value}
                </div>
                <p className="text-[11px] text-civic-muted mt-1">
                  {card.context}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Recent Activity + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Recent Reports Table (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-civic-border rounded-xl shadow-civic-subtle overflow-hidden">
          <div className="p-5 border-b border-civic-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#10213F] uppercase tracking-wider">
                RECENT COMPLAINT SUBMISSIONS
              </h3>
              <p className="text-xs text-civic-muted">Latest civic issue reports in MongoDB database</p>
            </div>
            <Link to="/admin/issues" className="text-xs font-bold text-civic-action hover:underline inline-flex items-center gap-1">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-civic-muted flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-civic-action" />
              Loading database reports...
            </div>
          ) : recentIssues.length === 0 ? (
            <div className="p-8 text-center text-xs text-civic-muted">
              No complaint reports recorded in database yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-civic-border">
                <thead className="bg-slate-50 text-[10px] font-bold text-[#10213F] uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-5 py-3 text-left">ID</th>
                    <th scope="col" className="px-5 py-3 text-left">Issue</th>
                    <th scope="col" className="px-5 py-3 text-left">Priority</th>
                    <th scope="col" className="px-5 py-3 text-left">Status</th>
                    <th scope="col" className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-civic-border text-xs">
                  {recentIssues.map((issue) => (
                    <tr 
                      key={issue.id}
                      onClick={() => navigate(`/admin/issues/${issue.id}`)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3.5 font-mono font-bold text-civic-action whitespace-nowrap">
                        {issue.code || issue.displayId || issue.id}
                      </td>
                      <td className="px-5 py-3.5 max-w-xs">
                        <div className="font-bold text-[#10213F] truncate">{issue.title}</div>
                        <div className="text-[11px] text-civic-muted truncate">{issue.categoryLabel || issue.category}</div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <PriorityBadge priority={issue.priority} />
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <StatusBadge status={issue.status} />
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        <span className="text-civic-action font-semibold text-[11px] inline-flex items-center gap-0.5">
                          View <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Operations Sidebar (1 col) */}
        <div className="space-y-6">
          
          <div className="bg-white border border-civic-border rounded-xl p-5 shadow-civic-subtle space-y-4">
            <div className="flex items-center gap-2 text-civic-action font-extrabold text-xs uppercase tracking-wider">
              <Brain className="w-4 h-4 text-purple-600" />
              <span>CivicAI Operational Health</span>
            </div>
            <div className="bg-purple-50/60 border border-purple-100 rounded-lg p-3 space-y-2">
              <div className="text-xs text-purple-900 font-bold">
                Backend AI Engine Active
              </div>
              <p className="text-[11px] text-purple-700 leading-relaxed">
                Gemini 2.5 Flash categorization, severity rating & automated department routing enabled.
              </p>
            </div>
          </div>

          <div className="bg-white border border-civic-border rounded-xl p-5 shadow-civic-subtle space-y-3">
            <h4 className="text-xs font-extrabold text-[#10213F] uppercase tracking-wider">
              Quick Admin Actions
            </h4>
            <div className="space-y-2">
              <Link 
                to="/admin/issues" 
                className="block bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-3 text-xs font-bold text-[#10213F] transition-colors"
              >
                Review All Pending Reports
              </Link>
              <Link 
                to="/admin/map" 
                className="block bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-3 text-xs font-bold text-[#10213F] transition-colors"
              >
                View Live Dispatch Map
              </Link>
              <Link 
                to="/admin/analytics" 
                className="block bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-3 text-xs font-bold text-[#10213F] transition-colors"
              >
                View Resolution Analytics
              </Link>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default AdminOverview;
