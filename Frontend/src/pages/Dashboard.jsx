import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCivic } from '../context/CivicContext';
import Container from '../components/Container';
import SectionHeading from '../components/SectionHeading';
import IssueCard from '../components/IssueCard';
import Button from '../components/Button';
import { User, FileText, Settings, ShieldAlert, LogIn, Plus } from 'lucide-react';

const Dashboard = () => {
  const { currentUser, issues, authStatus } = useCivic();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');

  if (!authStatus) {
    return (
      <Container className="max-w-md py-12">
        <div className="bg-white border border-civic-border rounded-lg p-8 text-center shadow-civic-normal">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-50 text-civic-action mb-4 border border-blue-100">
            <LogIn className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-civic-navy mb-2">Access Restricted</h2>
          <p className="text-xs text-civic-muted mb-6 leading-relaxed">
            Please sign in to view your submitted maintenance reports, local updates, and notification settings.
          </p>
          <Link to="/login" className="block">
            <Button variant="primary" size="md" className="w-full">
              Sign In Now
            </Button>
          </Link>
        </div>
      </Container>
    );
  }

  // Filter issues belonging to the user's ward (District 3 is default for resident)
  const myIssues = issues.filter(issue => issue.ward === currentUser.ward);
  
  const filteredMyIssues = myIssues.filter(issue => {
    if (activeTab === 'active') return issue.status !== 'Resolved';
    if (activeTab === 'resolved') return issue.status === 'Resolved';
    return true;
  });

  const activeCount = myIssues.filter(i => i.status !== 'Resolved').length;
  const resolvedCount = myIssues.filter(i => i.status === 'Resolved').length;

  return (
    <Container className="text-left space-y-8">
      {/* Welcome Header */}
      <div className="bg-slate-50 border border-civic-border rounded-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 text-civic-action rounded-full flex items-center justify-center border border-blue-200">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-civic-navy">{currentUser.name}</h2>
            <p className="text-xs text-civic-muted">
              Resident Account &bull; Registered in <strong className="text-civic-navy font-semibold">{currentUser.ward}</strong>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/report">
            <Button variant="primary" size="sm" icon={Plus}>
              Report New Issue
            </Button>
          </Link>
          {currentUser.role === 'admin' && (
            <Link to="/admin">
              <Button variant="secondary" size="sm" icon={ShieldAlert}>
                Admin Panel
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-civic-border rounded-lg p-5 shadow-civic-subtle">
          <span className="text-[10px] font-bold text-civic-muted uppercase tracking-wider">My Submissions</span>
          <div className="text-3xl font-extrabold text-civic-navy mt-1">{myIssues.length}</div>
          <p className="text-xs text-civic-muted mt-1">Total logged in {currentUser.ward}</p>
        </div>

        <div className="bg-white border border-civic-border rounded-lg p-5 shadow-civic-subtle">
          <span className="text-[10px] font-bold text-civic-muted uppercase tracking-wider">Active Investigations</span>
          <div className="text-3xl font-extrabold text-amber-600 mt-1">{activeCount}</div>
          <p className="text-xs text-civic-muted mt-1">Under dispatch or inspection</p>
        </div>

        <div className="bg-white border border-civic-border rounded-lg p-5 shadow-civic-subtle">
          <span className="text-[10px] font-bold text-civic-muted uppercase tracking-wider">Resolved Reports</span>
          <div className="text-3xl font-extrabold text-emerald-600 mt-1">{resolvedCount}</div>
          <p className="text-xs text-civic-muted mt-1">Closed and verified</p>
        </div>
      </div>

      {/* Issues Tabs */}
      <div>
        <SectionHeading 
          title="My Local Reports History" 
          subtitle="Review and track maintenance status updates specific to your community district."
          actions={
            <div className="flex border border-civic-border rounded bg-white p-0.5">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded cursor-pointer ${
                  activeTab === 'all' ? 'bg-civic-light-gray text-civic-navy' : 'text-civic-muted hover:text-civic-navy'
                }`}
              >
                All ({myIssues.length})
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`px-3 py-1.5 text-xs font-semibold rounded cursor-pointer ${
                  activeTab === 'active' ? 'bg-civic-light-gray text-civic-navy' : 'text-civic-muted hover:text-civic-navy'
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                onClick={() => setActiveTab('resolved')}
                className={`px-3 py-1.5 text-xs font-semibold rounded cursor-pointer ${
                  activeTab === 'resolved' ? 'bg-civic-light-gray text-civic-navy' : 'text-civic-muted hover:text-civic-navy'
                }`}
              >
                Resolved ({resolvedCount})
              </button>
            </div>
          }
        />

        {filteredMyIssues.length === 0 ? (
          <div className="bg-white border border-civic-border rounded-lg p-10 text-center shadow-civic-subtle">
            <span className="block text-sm font-bold text-civic-navy mb-1">No reports logged in this tab</span>
            <p className="text-xs text-civic-muted mb-4 max-w-xs mx-auto">
              If you have witnessed broken infrastructure in your district, submit a report to alert city works teams.
            </p>
            <Link to="/report">
              <Button variant="outline" size="sm" icon={Plus}>
                Report Issue
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredMyIssues.map(issue => (
              <IssueCard 
                key={issue.id} 
                issue={issue}
                onViewDetails={(selected) => {
                  alert(`Issue History for ${selected.id}:\n${selected.title}\nStatus: ${selected.status}\nLast updated: ${new Date(selected.updatedAt).toLocaleDateString()}`);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
};

export default Dashboard;
