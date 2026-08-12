import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCivic } from '../../context/CivicContext';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import { 
  Search, 
  X, 
  ChevronRight, 
  RotateCcw,
  ArrowUpDown,
  FileX
} from 'lucide-react';

const DEPARTMENT_OPTIONS = [
  "Municipal Roads Department",
  "Waste Management Department",
  "Electrical Maintenance Department",
  "Water Supply Department",
  "Drainage & Sanitation Department",
  "Municipal Infrastructure Department",
  "General Civic Services"
];

const AdminIssues = () => {
  const { issues, filters, setFilters, resetFilters } = useCivic();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Local Sort State
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'priority' | 'updated'

  // Extract query params if passed in URL
  const querySearch = searchParams.get('search');
  const queryStatus = searchParams.get('status');
  const queryPriority = searchParams.get('priority');

  // Distinct dropdown options derived from dataset
  const categories = useMemo(() => {
    const set = new Set(issues.map(i => i.category).filter(Boolean));
    return Array.from(set);
  }, [issues]);

  const wards = useMemo(() => {
    const set = new Set(issues.map(i => i.ward).filter(Boolean));
    return Array.from(set);
  }, [issues]);

  // Combine query params or context filters
  const activeSearch = querySearch !== null ? querySearch : filters.search;
  const activeStatus = queryStatus !== null ? queryStatus : filters.status;
  const activePriority = queryPriority !== null ? queryPriority : filters.priority;

  // Filter issues locally
  const filtered = useMemo(() => {
    return issues.filter(issue => {
      const matchCat = !filters.category || issue.category === filters.category;
      const matchStat = !activeStatus || issue.status === activeStatus;
      const matchPrio = !activePriority || issue.priority === activePriority;
      const matchWrd = !filters.ward || (issue.ward && issue.ward.toLowerCase().includes(filters.ward.toLowerCase()));
      const matchDept = !filters.department || (
        (issue.assignedDepartment && issue.assignedDepartment === filters.department) ||
        (issue.aiAnalysis?.recommendedDepartment && issue.aiAnalysis.recommendedDepartment === filters.department)
      );

      const q = (activeSearch || '').toLowerCase().trim();
      const matchQ = !q ||
        (issue.id && issue.id.toLowerCase().includes(q)) ||
        (issue.title && issue.title.toLowerCase().includes(q)) ||
        (issue.description && issue.description.toLowerCase().includes(q)) ||
        (issue.category && issue.category.toLowerCase().includes(q)) ||
        (issue.ward && issue.ward.toLowerCase().includes(q)) ||
        (issue.locationText && issue.locationText.toLowerCase().includes(q));

      return matchCat && matchStat && matchPrio && matchWrd && matchDept && matchQ;
    });
  }, [issues, filters, activeStatus, activePriority, activeSearch]);

  // Sort issues
  const sortedIssues = useMemo(() => {
    const list = [...filtered];
    if (sortBy === 'newest') {
      return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    if (sortBy === 'oldest') {
      return list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    }
    if (sortBy === 'updated') {
      return list.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    }
    if (sortBy === 'priority') {
      const weight = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1, 'Pending AI Analysis': 0 };
      return list.sort((a, b) => (weight[b.priority] || 0) - (weight[a.priority] || 0));
    }
    return list;
  }, [filtered, sortBy]);

  const handleClearAll = () => {
    resetFilters();
    setSearchParams({});
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '12 Aug 2026';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '12 Aug 2026';
    }
  };

  const hasActiveFilters = !!(activeSearch || activeStatus || activePriority || filters.category || filters.ward || filters.department);

  return (
    <div className="space-y-6 font-sans text-left">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-civic-border pb-4">
        <div>
          <span className="text-[10px] font-bold text-civic-action uppercase tracking-widest block font-mono">
            OPERATIONS ISSUE MANAGEMENT
          </span>
          <h2 className="text-xl font-extrabold text-[#10213F] tracking-tight mt-0.5">
            ISSUES
          </h2>
          <p className="text-xs text-civic-muted mt-1 leading-relaxed">
            Filter, search, audit, and route municipal reports across city wards.
          </p>
        </div>

        <div className="text-xs text-civic-navy font-bold bg-white border border-civic-border px-3.5 py-2 rounded-lg shadow-xs self-start sm:self-auto">
          Showing <span className="text-civic-action font-mono">{sortedIssues.length}</span> of <span className="font-mono">{issues.length}</span> Reports
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS CARD */}
      <div className="bg-white border border-civic-border rounded-xl p-5 shadow-civic-subtle space-y-4">
        
        {/* Search Bar & Sort Dropdown Row */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <input
              type="text"
              value={activeSearch || ''}
              onChange={(e) => {
                const val = e.target.value;
                setFilters({ ...filters, search: val });
                if (querySearch !== null) {
                  setSearchParams(prev => {
                    const n = new URLSearchParams(prev);
                    if (val) n.set('search', val); else n.delete('search');
                    return n;
                  });
                }
              }}
              placeholder="Search by Report ID, title, keyword, ward, category..."
              className="w-full text-xs bg-slate-50 border border-civic-border rounded-lg pl-9 pr-8 py-2.5 text-[#10213F] focus:outline-none focus:ring-1 focus:ring-civic-action"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            {activeSearch && (
              <button 
                onClick={() => {
                  setFilters({ ...filters, search: '' });
                  if (querySearch) setSearchParams(prev => { prev.delete('search'); return prev; });
                }}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort & Reset */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-civic-muted font-bold flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" /> Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs bg-slate-50 border border-civic-border rounded-lg px-3 py-2 text-[#10213F] font-semibold cursor-pointer focus:outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="priority">Highest Priority</option>
                <option value="updated">Recently Updated</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleClearAll}
                className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded-lg inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Multi-Select Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
          
          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-civic-muted uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={activeStatus || ''}
              onChange={(e) => {
                const val = e.target.value;
                setFilters({ ...filters, status: val });
                if (queryStatus !== null) {
                  setSearchParams(prev => {
                    const n = new URLSearchParams(prev);
                    if (val) n.set('status', val); else n.delete('status');
                    return n;
                  });
                }
              }}
              className="w-full text-xs bg-slate-50 border border-civic-border rounded-md px-2.5 py-1.5 text-[#10213F] font-semibold cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="AI Analyzed">AI Analyzed</option>
              <option value="Under Review">Under Review</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-[10px] font-bold text-civic-muted uppercase tracking-wider mb-1">
              Priority
            </label>
            <select
              value={activePriority || ''}
              onChange={(e) => {
                const val = e.target.value;
                setFilters({ ...filters, priority: val });
                if (queryPriority !== null) {
                  setSearchParams(prev => {
                    const n = new URLSearchParams(prev);
                    if (val) n.set('priority', val); else n.delete('priority');
                    return n;
                  });
                }
              }}
              className="w-full text-xs bg-slate-50 border border-civic-border rounded-md px-2.5 py-1.5 text-[#10213F] font-semibold cursor-pointer"
            >
              <option value="">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[10px] font-bold text-civic-muted uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={filters.category || ''}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-civic-border rounded-md px-2.5 py-1.5 text-[#10213F] font-semibold cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Ward Filter */}
          <div>
            <label className="block text-[10px] font-bold text-civic-muted uppercase tracking-wider mb-1">
              Ward / District
            </label>
            <select
              value={filters.ward || ''}
              onChange={(e) => setFilters({ ...filters, ward: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-civic-border rounded-md px-2.5 py-1.5 text-[#10213F] font-semibold cursor-pointer"
            >
              <option value="">All Wards</option>
              {wards.map(w => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-[10px] font-bold text-civic-muted uppercase tracking-wider mb-1">
              Department
            </label>
            <select
              value={filters.department || ''}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-civic-border rounded-md px-2.5 py-1.5 text-[#10213F] font-semibold cursor-pointer"
            >
              <option value="">All Departments</option>
              {DEPARTMENT_OPTIONS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* ISSUES DATA TABLE & MOBILE CARDS */}
      <div className="bg-white border border-civic-border rounded-xl shadow-civic-subtle overflow-hidden">
        
        {sortedIssues.length === 0 ? (
          /* EMPTY STATE */
          <div className="p-12 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-200">
              <FileX className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#10213F]">NO ISSUES FOUND</h3>
              <p className="text-xs text-civic-muted mt-1 leading-relaxed">
                Try adjusting your filters or search query to locate civic reports.
              </p>
            </div>
            <button
              onClick={handleClearAll}
              className="bg-civic-action hover:bg-civic-action-hover text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-xs"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-civic-border">
                <thead className="bg-slate-50 text-[10px] font-bold text-[#10213F] uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 text-left">Report ID</th>
                    <th scope="col" className="px-6 py-3.5 text-left">Issue Summary</th>
                    <th scope="col" className="px-6 py-3.5 text-left">Category</th>
                    <th scope="col" className="px-6 py-3.5 text-left">Ward / Location</th>
                    <th scope="col" className="px-6 py-3.5 text-left">Department</th>
                    <th scope="col" className="px-6 py-3.5 text-left">Priority</th>
                    <th scope="col" className="px-6 py-3.5 text-left">Status</th>
                    <th scope="col" className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-civic-border bg-white text-xs text-[#10213F]">
                  {sortedIssues.map((issue) => (
                    <tr 
                      key={issue.id}
                      onClick={() => navigate(`/admin/issues/${issue.id}`)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-civic-action whitespace-nowrap">
                        {issue.id}
                      </td>
                      <td className="px-6 py-4 font-bold text-[#10213F] max-w-xs">
                        <div className="truncate">{issue.title}</div>
                        <div className="text-[11px] text-civic-muted font-normal truncate mt-0.5">{issue.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-[11px] font-semibold text-civic-muted bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          {issue.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-xs">{issue.ward}</div>
                        <div className="text-[10px] text-civic-muted truncate max-w-[130px]">
                          {issue.location?.address || issue.locationText || 'Pinned Coordinates'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-[11px] font-medium text-slate-700">
                          {issue.assignedDepartment || issue.aiAnalysis?.recommendedDepartment || 'Unassigned'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PriorityBadge priority={issue.priority} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={issue.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/issues/${issue.id}`);
                          }}
                          className="bg-[#10213F] hover:bg-[#1A325C] text-white text-[11px] font-bold px-3 py-1.5 rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          View <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Issue Cards */}
            <div className="md:hidden p-4 space-y-3">
              {sortedIssues.map((issue) => (
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

                  <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200">
                    <span className="font-bold text-slate-500 uppercase text-[9px] block">Assigned Dept:</span>
                    {issue.assignedDepartment || issue.aiAnalysis?.recommendedDepartment || 'Unassigned'}
                  </div>

                  <div className="flex justify-between items-center pt-1 text-[11px] border-t border-slate-200/60">
                    <span className="text-slate-400 font-mono">{formatDate(issue.createdAt)}</span>
                    <span className="text-civic-action font-bold inline-flex items-center gap-0.5">
                      Inspect Issue <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>

    </div>
  );
};

export default AdminIssues;
