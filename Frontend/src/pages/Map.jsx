import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCivic } from '../context/CivicContext';
import Container from '../components/Container';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import CivicMap from '../components/map/CivicMap';
import MapFilters from '../components/map/MapFilters';
import SelectedIssuePanel from '../components/map/SelectedIssuePanel';
import MapLegend from '../components/map/MapLegend';
import { getIssueCoordinates } from '../utils/mapUtils';
import { MapPin, PlusCircle, FileX } from 'lucide-react';

const MapPage = () => {
  const { issues, selectedIssue, setSelectedIssue, filters, setFilters, resetFilters } = useCivic();

  // Trigger for fitting map bounds around filtered markers
  const [fitTrigger, setFitTrigger] = useState(0);

  // Filter issues based on active filters
  const filteredMapIssues = useMemo(() => {
    return issues.filter(issue => {
      const matchCat = !filters.category || issue.category === filters.category;
      const matchStat = !filters.status || issue.status === filters.status;
      const matchPrio = !filters.priority || issue.priority === filters.priority;
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
        (issue.locationText && issue.locationText.toLowerCase().includes(q)) ||
        (issue.location?.address && issue.location.address.toLowerCase().includes(q));

      return matchCat && matchStat && matchPrio && matchWrd && matchDept && matchSearch;
    });
  }, [issues, filters]);

  const handleSelectIssue = (issue) => {
    setSelectedIssue(issue);
  };

  const handleFitBounds = () => {
    setFitTrigger(prev => prev + 1);
  };

  return (
    <Container className="text-left py-6 space-y-6 font-sans">
      
      {/* MAP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-civic-border pb-4">
        <div>
          <span className="text-[10px] font-bold text-civic-action uppercase tracking-widest block font-mono">
            GEO-SPATIAL CIVIC DISCOVERY
          </span>
          <h1 className="text-2xl font-extrabold text-[#10213F] tracking-tight mt-0.5">
            LIVE CIVIC MAP
          </h1>
          <p className="text-xs text-civic-muted mt-1 leading-relaxed">
            Explore reported civic issues and see what is happening across the city.
          </p>
        </div>

        {/* CTA to Report Issue */}
        <Link to="/report">
          <button className="bg-civic-action hover:bg-civic-action-hover text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs">
            <PlusCircle className="w-4 h-4" /> Report a Civic Issue
          </button>
        </Link>
      </div>

      {/* MAP CONTROLS & FILTER BAR */}
      <MapFilters 
        issues={issues}
        filters={filters}
        setFilters={setFilters}
        onClearFilters={resetFilters}
        onFitBounds={handleFitBounds}
        filteredCount={filteredMapIssues.length}
        mode="public"
      />

      {/* MAIN MAP LAYOUT (Desktop: 75% Map, 25% List/Panel, Mobile: Map First) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* LEFT / MAIN MAP CANVAS (3 cols on Desktop) */}
        <div className="lg:col-span-3 h-[520px] md:h-[620px] relative rounded-xl overflow-hidden border border-civic-border shadow-civic-subtle bg-slate-100">
          
          <CivicMap 
            issues={filteredMapIssues}
            selectedIssue={selectedIssue}
            onSelectIssue={handleSelectIssue}
            mode="public"
            fitTrigger={fitTrigger}
          />

          {/* Map Legend Overlay */}
          <div className="absolute bottom-4 left-4 z-20 hidden sm:block">
            <MapLegend />
          </div>

          {/* Selected Issue Panel Overlay (Desktop & Tablet) */}
          {selectedIssue && (
            <div className="absolute top-4 right-4 z-20">
              <SelectedIssuePanel 
                issue={selectedIssue}
                onClose={() => setSelectedIssue(null)}
                mode="public"
              />
            </div>
          )}

          {/* Empty State Overlay if no issues match filters */}
          {filteredMapIssues.length === 0 && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xs z-20 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-200">
                <FileX className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#10213F]">NO ISSUES MATCH YOUR FILTERS</h3>
                <p className="text-xs text-civic-muted mt-0.5">Try adjusting your search query or status/priority filters.</p>
              </div>
              <button
                onClick={resetFilters}
                className="bg-civic-action hover:bg-civic-action-hover text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-xs"
              >
                Clear Filters
              </button>
            </div>
          )}

        </div>

        {/* RIGHT / SIDEBAR ISSUE LIST & SELECTED PANEL (1 col on Desktop) */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Mobile Selected Issue Panel (If open on mobile) */}
          {selectedIssue && (
            <div className="lg:hidden">
              <SelectedIssuePanel 
                issue={selectedIssue}
                onClose={() => setSelectedIssue(null)}
                mode="public"
              />
            </div>
          )}

          {/* RECENT ISSUES DIRECTORY LIST */}
          <div className="bg-white border border-civic-border rounded-xl shadow-civic-subtle overflow-hidden flex flex-col h-[520px] md:h-[620px]">
            
            <div className="p-4 border-b border-civic-border bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#10213F] uppercase tracking-wider">
                  RECENT ISSUES
                </h3>
                <span className="text-[10px] text-civic-muted font-medium">
                  Click to inspect & locate on map
                </span>
              </div>
              <span className="text-xs font-bold font-mono text-civic-action bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                {filteredMapIssues.length}
              </span>
            </div>

            {/* Scrollable Issue List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
              {filteredMapIssues.length === 0 ? (
                <div className="p-8 text-center text-xs text-civic-muted">
                  No issues found matching criteria.
                </div>
              ) : (
                filteredMapIssues.map((issue) => {
                  const coords = getIssueCoordinates(issue);
                  const isSelected = selectedIssue?.id === issue.id;

                  return (
                    <button
                      key={issue.id}
                      onClick={() => handleSelectIssue(issue)}
                      className={`w-full text-left p-3 rounded-lg transition-colors flex flex-col gap-1.5 border cursor-pointer ${
                        isSelected 
                          ? 'bg-blue-50/70 border-blue-200 shadow-xs' 
                          : 'bg-white hover:bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <span className="font-mono text-[10px] font-extrabold text-civic-action bg-blue-50 px-1.5 py-0.25 rounded border border-blue-100">
                          {issue.id}
                        </span>
                        <StatusBadge status={issue.status} />
                      </div>

                      <h4 className="text-xs font-bold text-[#10213F] line-clamp-1">
                        {issue.title}
                      </h4>

                      <div className="flex items-center justify-between text-[10px] text-civic-muted pt-1">
                        <span className="flex items-center gap-1 font-medium">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {coords ? issue.ward : <span className="text-amber-600 font-bold uppercase text-[9px]">LOCATION NOT MAPPED</span>}
                        </span>
                        <PriorityBadge priority={issue.priority} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Mobile Legend Footer */}
            <div className="p-3 bg-slate-50 border-t border-civic-border sm:hidden">
              <MapLegend />
            </div>

          </div>

        </div>

      </div>

    </Container>
  );
};

export default MapPage;
