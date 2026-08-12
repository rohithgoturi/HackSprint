import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCivic } from '../context/CivicContext';
import Container from '../components/Container';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { FileText, PlusCircle, ChevronRight, MapPin, Clock, FileX } from 'lucide-react';

const MyReports = () => {
  const { issues, currentUser } = useCivic();
  const navigate = useNavigate();

  // Filter reports belonging to current user
  const userReports = issues.filter(issue => {
    if (!currentUser) return false;
    if (issue.reportedBy === currentUser.id) return true;
    if (currentUser.id === 'citizen-demo' && (issue.reportedBy === 'citizen-demo' || !issue.reportedBy)) return true;
    return false;
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

      {/* Main Content Area */}
      <div className="bg-white border border-civic-border rounded-xl shadow-civic-subtle overflow-hidden">
        
        {userReports.length === 0 ? (
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
                        {issue.id}
                      </td>
                      <td className="px-6 py-4 font-bold text-[#10213F] max-w-xs">
                        <div className="truncate">{issue.title}</div>
                        <div className="text-[11px] text-civic-muted font-normal truncate mt-0.5">{issue.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-xs">{issue.ward}</div>
                        <div className="text-[10px] text-civic-muted truncate max-w-[140px]">
                          {issue.location?.address || issue.locationText || 'Pinned Coordinates'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PriorityBadge priority={issue.priority} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={issue.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-civic-muted text-[11px]">
                        {formatDate(issue.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/track?id=${issue.id}`);
                          }}
                          className="bg-civic-action hover:bg-civic-action-hover text-white text-[11px] font-bold px-3 py-1.5 rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          Track <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards */}
            <div className="md:hidden p-4 space-y-3">
              {userReports.map((issue) => (
                <div 
                  key={issue.id}
                  onClick={() => navigate(`/track?id=${issue.id}`)}
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
                      Track Status <ChevronRight className="w-3.5 h-3.5" />
                    </span>
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
