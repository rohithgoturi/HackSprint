import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  X, 
  RotateCcw, 
  Maximize2, 
  PlusCircle, 
  SlidersHorizontal 
} from 'lucide-react';

const DEPARTMENT_LIST = [
  "Municipal Roads Department",
  "Waste Management Department",
  "Electrical Maintenance Department",
  "Water Supply Department",
  "Drainage & Sanitation Department",
  "Municipal Infrastructure Department",
  "General Civic Services"
];

const MapFilters = ({ 
  issues = [], 
  filters = {}, 
  setFilters, 
  onClearFilters, 
  onFitBounds, 
  filteredCount = 0,
  mode = 'public'
}) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Derive distinct options from issues dataset
  const categories = useMemo(() => {
    return Array.from(new Set(issues.map(i => i.category).filter(Boolean)));
  }, [issues]);

  const wards = useMemo(() => {
    return Array.from(new Set(issues.map(i => i.ward).filter(Boolean)));
  }, [issues]);

  const hasActiveFilters = !!(
    filters.search || filters.status || filters.priority || 
    filters.category || filters.ward || filters.department
  );

  return (
    <div className="bg-white border border-civic-border rounded-xl p-4 shadow-civic-subtle space-y-3 font-sans text-left">
      
      {/* Top Controls Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Left: Search Bar & Count Badge */}
        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search ID, title, keyword, ward, category..."
              className="w-full text-xs bg-slate-50 border border-civic-border rounded-lg pl-9 pr-8 py-2 text-[#10213F] focus:outline-none focus:ring-1 focus:ring-civic-action"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            {filters.search && (
              <button 
                onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs font-bold text-[#10213F] bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg whitespace-nowrap">
            <span className="text-civic-action font-mono">{filteredCount}</span> issues found
          </div>
        </div>

        {/* Right: Map Action Buttons */}
        <div className="flex items-center gap-2 justify-between sm:justify-end">
          
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="sm:hidden text-xs font-bold text-[#10213F] bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-civic-action" /> Filter
          </button>

          {/* Fit Map / View All Issues */}
          <button
            onClick={onFitBounds}
            className="text-xs font-bold text-slate-700 hover:text-[#10213F] bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Fit map view bounds around currently filtered markers"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-500" /> View All Issues
          </button>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}

          {/* Report Issue CTA (Public Mode) */}
          {mode === 'public' && (
            <Link to="/report" className="hidden lg:inline-block">
              <button className="bg-civic-action hover:bg-civic-action-hover text-white text-xs font-bold px-3.5 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer">
                <PlusCircle className="w-3.5 h-3.5" /> Report Issue
              </button>
            </Link>
          )}

        </div>

      </div>

      {/* Desktop Filter Options Grid */}
      <div className="hidden sm:grid grid-cols-2 md:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100">
        
        {/* Status */}
        <div>
          <select
            value={filters.status || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
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

        {/* Priority */}
        <div>
          <select
            value={filters.priority || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            className="w-full text-xs bg-slate-50 border border-civic-border rounded-md px-2.5 py-1.5 text-[#10213F] font-semibold cursor-pointer"
          >
            <option value="">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <select
            value={filters.category || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="w-full text-xs bg-slate-50 border border-civic-border rounded-md px-2.5 py-1.5 text-[#10213F] font-semibold cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Ward */}
        <div>
          <select
            value={filters.ward || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, ward: e.target.value }))}
            className="w-full text-xs bg-slate-50 border border-civic-border rounded-md px-2.5 py-1.5 text-[#10213F] font-semibold cursor-pointer"
          >
            <option value="">All Wards</option>
            {wards.map(w => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>

        {/* Department */}
        <div>
          <select
            value={filters.department || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
            className="w-full text-xs bg-slate-50 border border-civic-border rounded-md px-2.5 py-1.5 text-[#10213F] font-semibold cursor-pointer"
          >
            <option value="">All Departments</option>
            {DEPARTMENT_LIST.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

      </div>

      {/* MOBILE FILTER DRAWER MODAL */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:hidden backdrop-blur-xs">
          <div className="bg-white border-t border-civic-border rounded-t-2xl w-full p-6 space-y-4 text-left animate-in slide-in-from-bottom duration-200">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#10213F] uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-civic-action" /> Filter Civic Issues
              </h3>
              <button 
                onClick={() => setMobileDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-civic-muted uppercase mb-1">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full text-xs bg-slate-50 border border-civic-border rounded-md px-3 py-2 text-[#10213F] font-semibold"
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

              <div>
                <label className="block text-[10px] font-bold text-civic-muted uppercase mb-1">Priority</label>
                <select
                  value={filters.priority || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full text-xs bg-slate-50 border border-civic-border rounded-md px-3 py-2 text-[#10213F] font-semibold"
                >
                  <option value="">All Priorities</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-civic-muted uppercase mb-1">Category</label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full text-xs bg-slate-50 border border-civic-border rounded-md px-3 py-2 text-[#10213F] font-semibold"
                >
                  <option value="">All Categories</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-civic-muted uppercase mb-1">Ward</label>
                <select
                  value={filters.ward || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, ward: e.target.value }))}
                  className="w-full text-xs bg-slate-50 border border-civic-border rounded-md px-3 py-2 text-[#10213F] font-semibold"
                >
                  <option value="">All Wards</option>
                  {wards.map(w => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={onClearFilters}
                className="flex-1 bg-slate-100 text-civic-navy text-xs font-bold py-2.5 rounded-lg"
              >
                CLEAR
              </button>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="flex-1 bg-civic-action text-white text-xs font-bold py-2.5 rounded-lg"
              >
                APPLY
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default MapFilters;
