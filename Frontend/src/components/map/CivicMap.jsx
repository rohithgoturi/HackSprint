import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import StatusBadge from '../StatusBadge';
import PriorityBadge from '../PriorityBadge';
import { getIssueCoordinates, createCivicMarkerIcon } from '../../utils/mapUtils';
import { ChevronRight, MapPin } from 'lucide-react';

// Subcomponent to dynamically pan and zoom when an issue is selected
const MapRecenter = ({ issue }) => {
  const map = useMap();
  useEffect(() => {
    if (!issue) return;
    const coords = getIssueCoordinates(issue);
    if (coords) {
      map.setView([coords.lat, coords.lng], 15, { animate: true, duration: 0.8 });
    }
  }, [issue, map]);
  return null;
};

// Subcomponent to fit bounds around all visible issues
const MapFitBoundsHandler = ({ issues, fitTrigger }) => {
  const map = useMap();
  useEffect(() => {
    if (!fitTrigger || !issues || issues.length === 0) return;
    const validCoords = issues
      .map(getIssueCoordinates)
      .filter(Boolean)
      .map(c => [c.lat, c.lng]);

    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: true });
    }
  }, [fitTrigger, issues, map]);
  return null;
};

const CivicMap = ({ 
  issues = [], 
  selectedIssue = null, 
  onSelectIssue, 
  mode = 'public',
  fitTrigger = 0 
}) => {
  const navigate = useNavigate();

  // Find center coordinates from selectedIssue or first valid mapped issue or default
  const defaultCenter = [37.7749, -122.4194];
  const initialCoords = (selectedIssue && getIssueCoordinates(selectedIssue)) || 
    (issues.length > 0 && getIssueCoordinates(issues[0])) || 
    { lat: defaultCenter[0], lng: defaultCenter[1] };

  return (
    <div className="w-full h-full relative z-10 rounded-lg overflow-hidden border border-slate-200">
      <MapContainer
        center={[initialCoords.lat, initialCoords.lng]}
        zoom={13}
        className="w-full h-full"
        scrollWheelZoom={true}
      >
        {/* CartoDB Positron Neutral Tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {/* Map Recenter Helper */}
        <MapRecenter issue={selectedIssue} />
        
        {/* Map Fit Bounds Helper */}
        <MapFitBoundsHandler issues={issues} fitTrigger={fitTrigger} />

        {/* Issue Markers */}
        {issues.map((issue) => {
          const coords = getIssueCoordinates(issue);
          if (!coords) return null; // Skip issues without valid coordinates gracefully

          const isSelected = selectedIssue?.id === issue.id;

          return (
            <Marker
              key={issue.id}
              position={[coords.lat, coords.lng]}
              icon={createCivicMarkerIcon(issue.priority, issue.status, isSelected)}
              eventHandlers={{
                click: () => {
                  if (onSelectIssue) onSelectIssue(issue);
                }
              }}
            >
              <Popup>
                <div className="p-1 space-y-2 text-xs font-sans text-left max-w-xs">
                  <div className="flex justify-between items-center gap-2 border-b border-slate-100 pb-1">
                    <span className="font-mono font-bold text-civic-action text-[11px]">{issue.id}</span>
                    <StatusBadge status={issue.status} />
                  </div>

                  <h4 className="font-bold text-[#10213F] text-xs leading-snug">{issue.title}</h4>

                  <p className="text-[11px] text-civic-muted line-clamp-2 leading-relaxed">
                    {issue.description}
                  </p>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-[11px]">
                    <PriorityBadge priority={issue.priority} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const targetPath = mode === 'admin' ? `/admin/issues/${issue.id}` : `/track?id=${issue.id}`;
                        navigate(targetPath);
                      }}
                      className="bg-[#10213F] hover:bg-[#1A325C] text-white text-[10px] font-bold px-2.5 py-1 rounded inline-flex items-center gap-0.5 cursor-pointer transition-colors"
                    >
                      VIEW ISSUE <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

      </MapContainer>
    </div>
  );
};

export default CivicMap;
