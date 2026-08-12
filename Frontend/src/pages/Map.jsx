import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useCivic } from '../context/CivicContext';
import Container from '../components/Container';
import SectionHeading from '../components/SectionHeading';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { MapPin, Search, Navigation, Info, ListFilter } from 'lucide-react';
import { issueCategories } from '../data/mockIssues';

// Fix Leaflet marker icon asset resolution issues in bundlers
delete L.Icon.Default.prototype._getIconUrl;

const createCustomIcon = (status) => {
  let color = '#2563EB'; // Submitted (Blue)
  if (status === 'In Progress') color = '#D97706'; // Amber
  if (status === 'Resolved') color = '#059669'; // Emerald

  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;
  
  return L.divIcon({
    html: svgIcon,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

// Component to dynamically pan and zoom the map when selectedIssue changes
const MapRecenter = ({ location }) => {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.setView([location.lat, location.lng], 15, { animate: true, duration: 1 });
    }
  }, [location, map]);
  return null;
};

const MapPage = () => {
  const { filteredIssues, selectedIssue, setSelectedIssue, filters, setFilters } = useCivic();
  const mapRef = useRef(null);
  
  // Center of San Francisco
  const sfCenter = [37.7749, -122.4194];

  const handleSelectIssue = (issue) => {
    setSelectedIssue(issue);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Container className="text-left flex flex-col h-[calc(100vh-8.5rem)] min-h-[500px]">
      <div className="flex-none">
        <SectionHeading 
          title="Interactive Dispatch Heatmap" 
          subtitle="Real-time map visualizing community infrastructure issues. Click on a marker to inspect details, or select an issue from the dispatch log."
        />
      </div>

      {/* Main Map Container */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 border border-civic-border rounded-lg overflow-hidden bg-white shadow-civic-subtle min-h-0">
        
        {/* Left Side: Directory of reports */}
        <div className="lg:col-span-1 border-r border-civic-border flex flex-col h-full bg-slate-50 min-h-0">
          <div className="p-4 border-b border-civic-border bg-white flex-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-civic-navy flex items-center gap-1.5 mb-3">
              <ListFilter className="w-3.5 h-3.5 text-civic-action" /> Filter Live Map
            </span>
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search ID, title..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full text-xs border border-civic-border rounded pl-8 pr-3 py-2 bg-white text-civic-navy focus:outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-full text-xs border border-civic-border rounded px-2 py-2 bg-white text-civic-navy focus:outline-none cursor-pointer"
              >
                <option value="">All Categories</option>
                {issueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1 bg-slate-50 min-h-0">
            {filteredIssues.length === 0 ? (
              <div className="p-8 text-center text-xs text-civic-muted">
                No active issues match criteria.
              </div>
            ) : (
              filteredIssues.map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => handleSelectIssue(issue)}
                  className={`w-full text-left p-3 rounded-md transition-colors flex flex-col gap-1.5 border border-transparent cursor-pointer ${
                    selectedIssue?.id === issue.id 
                      ? 'bg-white border-civic-border shadow-sm' 
                      : 'hover:bg-slate-100'
                  }`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-[10px] font-bold text-civic-muted font-mono bg-slate-200/60 px-1.5 py-0.25 rounded">{issue.id}</span>
                    <span className="text-[10px] font-semibold text-civic-action uppercase tracking-wider">{issue.category}</span>
                  </div>
                  <h4 className="text-xs font-bold text-civic-navy line-clamp-1">{issue.title}</h4>
                  <div className="flex items-center justify-between text-[10px] text-civic-muted mt-1">
                    <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5 text-slate-400" /> {issue.ward}</span>
                    <span className={`px-1.5 py-0.25 rounded-full font-semibold border ${
                      issue.status === 'Submitted' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      issue.status === 'In Progress' ? 'bg-amber-50 text-amber-800 border-amber-100' :
                      'bg-emerald-50 text-emerald-800 border-emerald-100'
                    }`}>{issue.status}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Map */}
        <div className="lg:col-span-3 h-[400px] lg:h-full relative min-h-0">
          <MapContainer 
            center={sfCenter} 
            zoom={13} 
            className="w-full h-full"
            ref={mapRef}
          >
            {/* Elegant CartoDB Positron Light Tiles */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            
            {/* Markers */}
            {filteredIssues.map((issue) => (
              <Marker 
                key={issue.id} 
                position={[issue.location.lat, issue.location.lng]}
                icon={createCustomIcon(issue.status)}
                eventHandlers={{
                  click: () => {
                    setSelectedIssue(issue);
                  }
                }}
              >
                <Popup>
                  <div className="text-left p-1 max-w-[200px] space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="font-mono text-[9px] font-bold text-civic-muted bg-slate-100 px-1 py-0.25 rounded">{issue.id}</span>
                      <PriorityBadge priority={issue.priority} />
                    </div>
                    
                    <h3 className="font-bold text-xs text-civic-navy leading-snug">{issue.title}</h3>
                    
                    <p className="text-[10px] text-civic-muted line-clamp-2 leading-relaxed">{issue.description}</p>
                    
                    <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 text-[9px] text-civic-muted">
                      <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" /> {issue.ward}</span>
                      <span className="font-bold">{issue.status}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Recenter helper */}
            {selectedIssue && (
              <MapRecenter location={selectedIssue.location} />
            )}
          </MapContainer>

          {/* Quick Stats Panel overlaid on Map */}
          <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-xs border border-civic-border rounded p-3.5 shadow-md z-10 flex gap-4 text-xs font-semibold text-civic-navy">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
              <span>Submitted ({filteredIssues.filter(i => i.status === 'Submitted').length})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
              <span>In Progress ({filteredIssues.filter(i => i.status === 'In Progress').length})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
              <span>Resolved ({filteredIssues.filter(i => i.status === 'Resolved').length})</span>
            </div>
          </div>
        </div>

      </div>
    </Container>
  );
};

export default MapPage;
