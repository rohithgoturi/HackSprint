import React from 'react';
import { Link } from 'react-router-dom';
import { useCivic } from '../context/CivicContext';
import Container from '../components/Container';
import SectionHeading from '../components/SectionHeading';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { ShieldAlert, Trash2, ArrowRight, UserCheck, AlertTriangle } from 'lucide-react';
import { issueStatuses } from '../data/mockIssues';

const Admin = () => {
  const { issues, updateIssueStatus, deleteIssue, currentUser, isAdmin } = useCivic();

  if (!currentUser || !isAdmin) {
    return (
      <Container className="max-w-md py-12">
        <div className="bg-white border border-civic-border rounded-lg p-8 text-center shadow-civic-normal">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-50 text-red-600 mb-4 border border-red-100">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-civic-navy mb-2">Access Denied</h2>
          <p className="text-xs text-civic-muted mb-6 leading-relaxed">
            This dashboard is restricted to verified municipal supervisors, service dispatchers, and public agency administrators.
          </p>
          <div className="space-y-2">
            <Link to="/login" className="block">
              <Button variant="primary" size="md" className="w-full">
                Sign In as Administrator
              </Button>
            </Link>
            <Link to="/" className="block text-xs text-civic-action hover:text-civic-action-hover font-semibold mt-2">
              Back to Public Portal
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  const handleStatusChange = (id, newStatus) => {
    updateIssueStatus(id, newStatus);
  };

  const handleDelete = (id) => {
    if (window.confirm(`Are you sure you want to delete report ${id}? This action cannot be undone.`)) {
      deleteIssue(id);
    }
  };

  return (
    <Container className="text-left space-y-8">
      {/* Admin Panel Header */}
      <div className="bg-slate-50 border border-civic-border rounded-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center border border-red-100">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-civic-navy">Municipal Dispatch Center</h2>
            <p className="text-xs text-civic-muted">
              Supervisor: <strong className="text-civic-navy font-semibold">{currentUser.name}</strong> &bull; Portal Level Access
            </p>
          </div>
        </div>
        <div className="text-xs text-civic-muted bg-white border border-civic-border px-4 py-2 rounded-md font-semibold">
          Department: Public Works Dispatch
        </div>
      </div>

      {/* Main Panel Content */}
      <div>
        <SectionHeading 
          title="Active Dispatch Worksheets" 
          subtitle="Audit submitted citizen cases, re-route service priorities, assign contractor statuses, or filter spam submissions."
        />

        <div className="bg-white border border-civic-border rounded-lg shadow-civic-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-civic-border text-left">
              <thead className="bg-slate-50 text-civic-navy text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4">ID</th>
                  <th scope="col" className="px-6 py-4">Issue Details</th>
                  <th scope="col" className="px-6 py-4">Ward / Location</th>
                  <th scope="col" className="px-6 py-4">Severity</th>
                  <th scope="col" className="px-6 py-4">Work Status</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-civic-border text-xs text-civic-navy bg-white">
                {issues.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-civic-muted">
                      No reported issues remain in the system database.
                    </td>
                  </tr>
                ) : (
                  issues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* ID */}
                      <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-civic-navy">
                        {issue.id}
                      </td>
                      
                      {/* Issue Details */}
                      <td className="px-6 py-4 max-w-sm">
                        <div className="font-bold text-civic-navy text-sm mb-0.5">{issue.title}</div>
                        <div className="text-civic-muted text-xs line-clamp-1">{issue.description}</div>
                        <span className="text-[10px] font-bold text-civic-action bg-blue-50 border border-blue-100 rounded px-1.5 py-0.25 mt-1.5 inline-block uppercase">
                          {issue.category}
                        </span>
                      </td>

                      {/* Ward */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold">{issue.ward}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {issue.location.lat.toFixed(4)}, {issue.location.lng.toFixed(4)}
                        </div>
                      </td>

                      {/* Severity */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PriorityBadge priority={issue.priority} />
                      </td>

                      {/* Work Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={issue.status}
                          onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                          className={`text-xs font-semibold rounded border px-2 py-1.5 bg-white cursor-pointer focus:outline-none ${
                            issue.status === 'Submitted' ? 'text-blue-700 border-blue-200' :
                            issue.status === 'In Progress' ? 'text-amber-800 border-amber-200' :
                            'text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {issueStatuses.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleDelete(issue.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-colors inline-flex items-center cursor-pointer"
                          title="Delete Report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Admin;
