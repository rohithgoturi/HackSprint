import L from 'leaflet';
import { normalizeStatus } from './statusConfig';

/**
 * Safely extracts latitude and longitude from an issue object.
 * Returns { lat, lng } object with valid numbers, or null if coordinates are invalid/missing.
 */
export const getIssueCoordinates = (issue) => {
  if (!issue) return null;

  let lat = null;
  let lng = null;

  // Case 1: issue.location as { lat, lng }
  if (issue.location && typeof issue.location.lat === 'number' && typeof issue.location.lng === 'number') {
    lat = issue.location.lat;
    lng = issue.location.lng;
  }
  // Case 2: issue.lat and issue.lng directly
  else if (typeof issue.lat === 'number' && typeof issue.lng === 'number') {
    lat = issue.lat;
    lng = issue.lng;
  }
  // Case 3: issue.location as string or array
  else if (Array.isArray(issue.location) && issue.location.length >= 2) {
    lat = Number(issue.location[0]);
    lng = Number(issue.location[1]);
  }

  // Validate coordinates are real numbers
  if (typeof lat === 'number' && !isNaN(lat) && typeof lng === 'number' && !isNaN(lng)) {
    // Basic boundary checks (-90 to 90 lat, -180 to 180 lng)
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  return null;
};

/**
 * Derives hex color for marker pins based on status and priority.
 */
export const getMarkerColor = (priority, status) => {
  const normStatus = normalizeStatus(status);
  if (normStatus === 'Resolved') return '#059669'; // Emerald Green
  if (priority === 'High' || priority === 'Critical') return '#DC2626'; // Red
  if (priority === 'Medium') return '#D97706'; // Amber
  return '#2563EB'; // Blue / Low / Pending
};

/**
 * Creates a custom Leaflet divIcon SVG pin marker.
 */
export const createCivicMarkerIcon = (priority, status, isSelected = false) => {
  const color = getMarkerColor(priority, status);
  const size = isSelected ? 36 : 30;
  const strokeColor = isSelected ? '#10213F' : '#FFFFFF';
  const strokeWidth = isSelected ? 2.5 : 1.5;

  const svgHtml = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="${size}" height="${size}" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'}; transition: transform 0.2s ease;">
      <path stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;

  return L.divIcon({
    html: svgHtml,
    className: `civic-custom-marker ${isSelected ? 'is-selected' : ''}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size]
  });
};
