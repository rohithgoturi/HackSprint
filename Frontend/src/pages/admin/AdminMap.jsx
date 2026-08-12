import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCivic } from '../../context/CivicContext';
import CivicMap from '../../components/map/CivicMap';
import MapFilters from '../../components/map/MapFilters';
import SelectedIssuePanel from '../../components/map/SelectedIssuePanel';
import MapLegend from '../../components/map/MapLegend';
import { MapPin, SlidersHorizontal, RotateCcw } from 'lucide-react';

const AdminMap = () => {
  const { issues, selectedIssue, setSelectedIssue, filters, setFilters, resetFilters } = useCivic();
  const navigate = useNavigate();

  const [fitTrigger, setFitTrigger] = useState(0);

  // Filter issues based on active filters
  const filteredMapIssues = useMemo(() => {
    return issues.filter(issue => {
      const matchStat = !filters.status || issue.status === filters.status;
      const matchPrio = !filters.priority || issue.priority === filters.priority;
      const matchCat = !filters.category || issue.category === filters.category;
      const matchWrd = !filters.ward || (issue.ward && issue.ward.toLowerCase().includes(filters.ward.toLowerCase()));
      const matchDept = !filters.department || (
        (issue.assignedDepartment && issue.assignedDepartment === filters.department) ||
        (issue.aiAnalysis?.recommendedDepartment && issue.aiAnalysis.recommendedDepartment === filters.department)
      );

      const q = (filters.search || '').toLowerCase().trim();
      const matchSearch = !q ||
        (issue.id && issue.id.toLowerCase().includes(q)) ||
        (issue.title && issue.title.toLowerCase().includes(q)) ||
        (issue.description && issue.description.toLowerCase().includes(q)) ||
        (issue.category && issue.category.toLowerCase().includes(q)) ||
        (issue.ward && issue.ward.toLowerCase().includes(q)) ||
        (issue.locationText && issue.locationText.toLowerCase().includes(q));

      return matchStat && matchPrio && matchCat && matchWrd && matchDept && matchSearch;
    });
  }, [issues, filters]);

  const handleSelectIssue = (issue) => {
    setSelectedIssue(issue);
  };

  const handleFitBounds = () => {
    setFitTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6 font-sans text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-civic-border pb-4">
        <div>
          <span className="text-[10px] font-bold text-civic-action uppercase tracking-widest block font-mono">
            GEO-SPATIAL MUNICIPAL INTELLIGENCE
          </span>
          <h2 className="text-xl font-extrabold text-[#10213F] tracking-tight mt-0.5">
            CITY CIVIC MAP
          </h2>
          <p className="text-xs text-civic-muted mt-1 leading-relaxed">
            Geographic distribution of reported civic hazards across municipal wards.
          </p>
        </div>

        <div className="text-xs text-[#10213F] font-bold bg-white border border-civic-border px-3.5 py-2 rounded-lg shadow-xs">
          Showing <span className="text-civic-action font-mono">{filteredMapIssues.length}</span> Active Pins
        </div>
      </div>

      {/* MAP CONTROLS & FILTER BAR */}
      <MapFilters
        issues={issues}
        filters={filters}
        setFilters={setFilters}
        onClearFilters={resetFilters}
        onFitBounds={handleFitBounds}
        filteredCount={filteredMapIssues.length}
        mode="admin"
      />

      {/* MAP CANVAS CONTAINER */}
      <div className="h-[600px] w-full relative rounded-xl overflow-hidden border border-civic-border shadow-civic-subtle bg-slate-100 p-2">
        <CivicMap
          issues={filteredMapIssues}
          selectedIssue={selectedIssue}
          onSelectIssue={handleSelectIssue}
          mode="admin"
          fitTrigger={fitTrigger}
        />

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-20 hidden sm:block">
          <MapLegend />
        </div>

        {/* Selected Issue Panel Overlay */}
        {selectedIssue && (
          <div className="absolute top-4 right-4 z-20">
            <SelectedIssuePanel
              issue={selectedIssue}
              onClose={() => setSelectedIssue(null)}
              mode="admin"
            />
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminMap;
