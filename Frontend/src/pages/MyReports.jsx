import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCivic } from '../context/CivicContext';
import Container from '../components/Container';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { FileText, PlusCircle, ChevronRight, MapPin, Clock, FileX, Loader2, AlertCircle } from 'lucide-react';

const MyReports = () => {
  const { issues, currentUser, fetchComplaints, loading, error } = useCivic();
  const navigate = useNavigate();

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Filter reports belonging to current user
  const userReports = issues.filter(issue => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    const cid = currentUser._id || currentUser.id;
    if (issue.reportedBy === cid) return true;
    if (issue.citizenInfo && (issue.citizenInfo._id === cid || issue.citizenInfo.id === cid)) return true;
    return true; // Show fetched complaints returned by scoped GET /api/complaints endpoint
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '12 Aug 2026';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '12 Aug 2026';
    }
  };

  return (
    <Container className="max-w-5xl py-8 font-sans text-left space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-civic-border pb-4">
        <div>
          <span className="text-[10px] font-bold text-civic-action uppercase tracking-widest block font-mono">
            CITIZEN ACCOUNT PORTAL
          </span>
          <h1 className="text-2xl font-extrabold text-[#10213F] tracking-tight mt-0.5">
            MY REPORTS
          </h1>
          <p className="text-xs text-civic-muted mt-1 leading-relaxed">
            Track the civic issues you have reported.
          </p>
        </div>

        <Link to="/report">
          <button className="bg-civic-action hover:bg-civic-action-hover text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs">
            <PlusCircle className="w-4 h-4" /> Report an Issue
          </button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white border border-civic-border rounded-xl shadow-civic-subtle overflow-hidden">
        
        {loading ? (
          <div className="p-12 text-center text-xs text-civic-muted flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-civic-action" />
            Loading your reports from civic server...
          </div>
        ) : userReports.length === 0 ? (
          /* EMPTY STATE */
          <div className="p-12 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-200">
              <FileX className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#10213F]">NO REPORTS YET</h3>
              <p className="text-xs text-civic-muted leading-relaxed">
                Your submitted civic issues will appear here.
              </p>
            </div>
            <Link to="/report" className="inline-block pt-2">
              <button className="bg-civic-action hover:bg-civic-action-hover text-white text-xs font-bold px-5 py-2.5 rounded-lg cursor-pointer transition-colors shadow-xs inline-flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4" /> REPORT AN ISSUE
              </button>
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-civic-border">
                <thead className="bg-slate-50 text-[10px] font-bold text-[#10213F] uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 text-left">Report ID</th>
                    <th scope="col" className="px-6 py-3.5 text-left">Issue</th>
                    <th scope="col" className="px-6 py-3.5 text-left">Location / Ward</th>
                    <th scope="col" className="px-6 py-3.5 text-left">Priority</th>
                    <th scope="col" className="px-6 py-3.5 text-left">Status</th>
                    <th scope="col" className="px-6 py-3.5 text-left">Reported Date</th>
                    <th scope="col" className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-civic-border bg-white text-xs text-[#10213F]">
                  {userReports.map((issue) => (
                    <tr 
                      key={issue.id}
                      onClick={() => navigate(`/track?id=${issue.id}`)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-civic-action whitespace-nowrap">
                        {issue.code || issue.displayId || issue.id}
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="font-bold text-[#10213F] truncate">{issue.title}</div>
                        <div className="text-[11px] text-civic-muted truncate mt-0.5">{issue.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-slate-700 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{issue.ward || 'Central Ward'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PriorityBadge priority={issue.priority} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={issue.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-civic-muted text-[11px]">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(issue.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                        <span className="text-civic-action hover:underline inline-flex items-center gap-0.5 font-semibold text-[11px]">
                          Track <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-civic-border">
              {userReports.map((issue) => (
                <div 
                  key={issue.id}
                  onClick={() => navigate(`/track?id=${issue.id}`)}
                  className="p-4 space-y-3 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-bold text-civic-action">
                      {issue.code || issue.displayId || issue.id}
                    </span>
                    <StatusBadge status={issue.status} />
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-[#10213F]">{issue.title}</h4>
                    <p className="text-xs text-civic-muted line-clamp-2 mt-1">{issue.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-civic-muted">
                    <PriorityBadge priority={issue.priority} />
                    <span>{formatDate(issue.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>

    </Container>
  );
};

export default MyReports;
