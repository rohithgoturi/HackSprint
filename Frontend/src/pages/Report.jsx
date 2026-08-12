import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useCivic } from '../context/CivicContext';
import Container from '../components/Container';
import Button from '../components/Button';
import SectionHeading from '../components/SectionHeading';
import { 
  ChevronLeft, UploadCloud, Trash2, MapPin, CheckCircle2, 
  Copy, Check, AlertCircle, Navigation, Info, ShieldCheck, 
  HelpCircle, Image as ImageIcon, Brain
} from 'lucide-react';
import { issueCategories } from '../data/mockIssues';

// Leaflet custom marker icon
const customMarkerIcon = L.divIcon({
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2563EB" width="32" height="32">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `,
  className: 'custom-report-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// Click listener helper subcomponent for Leaflet map picking
const MapClickHandler = ({ onLocationPick }) => {
  useMapEvents({
    click(e) {
      onLocationPick(e.latlng);
    }
  });
  return null;
};

// Map Recenter subcomponent
const MapRecenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center[0] && center[1]) {
      map.setView(center, 15, { animate: true });
    }
  }, [center, map]);
  return null;
};

const Report = () => {
  const { reportIssue } = useCivic();
  const navigate = useNavigate();

  // State definitions
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [ward, setWard] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  
  // Coordinates State
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  // File Upload State
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoError, setPhotoError] = useState('');

  // Status & UI States
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [newIssueId, setNewIssueId] = useState('');
  const [geolocationError, setGeolocationError] = useState('');
  const [showCopyToast, setShowCopyToast] = useState(false);

  // File input ref for clearing
  const fileInputRef = useRef(null);

  // Default map center (San Francisco)
  const defaultCenter = [37.7749, -122.4194];

  // Revoke object URL to avoid memory leaks
  useEffect(() => {
    if (!photo) {
      setPhotoPreview('');
      return;
    }

    const objectUrl = URL.createObjectURL(photo);
    setPhotoPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [photo]);

  // Handle Photo Selection
  const handlePhotoChange = (e) => {
    setPhotoError('');
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (max 5MB)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setPhotoError('File size exceeds the 5 MB limit. Please select a smaller photo.');
      return;
    }

    // Validate format
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setPhotoError('Invalid image format. Allowed formats: JPG, JPEG, PNG, WEBP.');
      return;
    }

    setPhoto(file);
  };

  // Remove Photo
  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Map click coordinate picker callback
  const handleMapLocationPick = (latlng) => {
    setLat(latlng.lat);
    setLng(latlng.lng);
    setErrors(prev => ({ ...prev, location: '' }));
  };

  // Use Browser Geolocation
  const handleUseMyLocation = () => {
    setGeolocationError('');
    if (!navigator.geolocation) {
      setGeolocationError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLat(latitude);
        setLng(longitude);
        setErrors(prev => ({ ...prev, location: '' }));
        // Set mock address placeholder if empty
        if (!address) {
          setAddress(`Near coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
      },
      (error) => {
        let msg = 'Could not retrieve location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please drop a pin manually on the map.';
        }
        setGeolocationError(msg);
      }
    );
  };

  // Validate fields
  const validateForm = () => {
    const newErrors = {};
    
    if (!category) {
      newErrors.category = 'Please select an issue category.';
    }
    
    if (!description.trim()) {
      newErrors.description = 'Please describe the problem.';
    } else if (description.trim().length < 10) {
      newErrors.description = 'Please provide a more detailed description (minimum 10 characters).';
    }

    if (!address.trim() && (lat === null || lng === null)) {
      newErrors.location = 'Please provide the issue address or click on the map to pin it.';
    }

    if (!ward) {
      newErrors.ward = 'Please specify the ward or district number.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Report
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const mockImageLink = photoPreview ? 'https://images.unsplash.com/photo-1599740831464-59cb4a52a36b?auto=format&fit=crop&w=800&q=80' : null;
      
      const newIssue = await reportIssue({
        title: `${category} reported at ${address || 'Pinned Location'}`,
        category,
        description: description + (additionalDetails ? ` Details: ${additionalDetails}` : ''),
        ward,
        image: mockImageLink,
        location: {
          lat: lat || defaultCenter[0],
          lng: lng || defaultCenter[1]
        }
      });

      setNewIssueId(newIssue.id || newIssue._id);
      setIsSubmitted(true);
    } catch (err) {
      setErrors((prev) => ({ ...prev, submit: err.message || 'Failed to submit complaint to backend' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy ID and trigger toast
  const handleCopyId = () => {
    if (!newIssueId) return;
    navigator.clipboard.writeText(newIssueId).then(() => {
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 2000);
    });
  };

  // Success view
  if (isSubmitted) {
    return (
      <Container className="max-w-xl py-10 font-sans text-left">
        <div className="bg-white border border-civic-border rounded-xl p-8 shadow-civic-normal space-y-6">
          
          <div className="text-center space-y-2">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 mb-2">
              <ShieldCheck className="h-6.5 w-6.5" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-civic-navy font-sans">Report Submitted</h2>
            <p className="text-xs text-civic-muted leading-relaxed">
              Your issue has been recorded. JanSetu AI can now analyze your report.
            </p>
          </div>

          {/* Details Table */}
          <div className="bg-slate-50 border border-civic-border rounded-lg p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-bold text-civic-muted uppercase tracking-wider">Report Tracking ID</span>
                <div className="text-lg font-extrabold text-civic-navy font-mono mt-0.5">{newIssueId}</div>
              </div>
              <div className="relative">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleCopyId}
                  icon={showCopyToast ? Check : Copy}
                  className="text-xs font-semibold cursor-pointer"
                >
                  {showCopyToast ? 'Copied' : 'Copy ID'}
                </Button>
                {showCopyToast && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-2 py-0.5 rounded shadow-md whitespace-nowrap z-20">
                    Copied to clipboard
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-sans text-civic-navy">
              <div>
                <span className="block text-[9px] font-bold text-civic-muted uppercase tracking-wide">Category</span>
                <span className="font-bold">{category}</span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-civic-muted uppercase tracking-wide">Ward / District</span>
                <span className="font-bold">{ward}</span>
              </div>
              <div className="col-span-2">
                <span className="block text-[9px] font-bold text-civic-muted uppercase tracking-wide">Location Address</span>
                <span className="font-medium text-civic-muted leading-tight block mt-0.5">{address || 'Coordinates pinned on map'}</span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-civic-muted uppercase tracking-wide">Resolution Status</span>
                <span className="inline-flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span className="font-bold text-blue-700">Reported</span>
                </span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-civic-muted uppercase tracking-wide">AI Dispatch Queue</span>
                <span className="font-bold text-amber-700 block mt-1">Pending Analysis</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link to={`/analyze/${newIssueId}`} className="flex-grow">
              <Button variant="primary" size="md" className="w-full font-bold" icon={Brain}>
                ANALYZE WITH JANSETU AI
              </Button>
            </Link>
            <Link to={`/track?id=${newIssueId}`} className="flex-grow">
              <Button variant="secondary" size="md" className="w-full font-semibold">
                TRACK REPORT
              </Button>
            </Link>
          </div>

        </div>
      </Container>
    );
  }

  return (
    <Container className="max-w-4xl text-left py-4 font-sans">
      
      {/* Back Button */}
      <Link to="/" className="inline-flex items-center gap-1 text-xs text-civic-muted hover:text-civic-navy font-semibold mb-6">
        <ChevronLeft className="w-3.5 h-3.5" /> Back to Home
      </Link>

      {/* Page Header */}
      <SectionHeading 
        title="Report a Civic Issue" 
        subtitle="Help improve your neighborhood by reporting a problem that needs attention. Your report helps local teams understand where action is needed."
      />

      {/* Main Form container */}
      <div className="bg-white border border-civic-border rounded-xl shadow-civic-subtle overflow-hidden">
        
        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xs z-50 flex flex-col items-center justify-center space-y-4">
            <div className="w-8 h-8 border-4 border-civic-action border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold text-civic-navy font-sans">Submitting Report...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          
          {/* SECTION 1 — WHAT IS THE PROBLEM? */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-civic-navy uppercase tracking-wider border-b border-slate-100 pb-2">
              01 &bull; What is the problem?
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Category selector */}
              <div className="md:col-span-1">
                <label htmlFor="category" className="block text-xs font-bold uppercase tracking-wider text-civic-navy mb-1.5">
                  Issue Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setErrors(prev => ({ ...prev, category: '' }));
                  }}
                  className={`w-full text-xs border rounded px-3 py-2.5 bg-white text-civic-navy focus:outline-none focus:ring-1 focus:ring-civic-action cursor-pointer ${
                    errors.category ? 'border-red-500' : 'border-civic-border'
                  }`}
                >
                  <option value="">Select Category</option>
                  {issueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
                {errors.category && (
                  <span className="text-[10px] text-red-600 font-semibold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-red-500" /> {errors.category}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-civic-navy">
                    Describe the Problem <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-[10px] font-bold ${description.length > 500 ? 'text-red-600' : 'text-civic-muted'}`}>
                    {description.length} / 500
                  </span>
                </div>
                <textarea
                  id="description"
                  rows={4}
                  maxLength={520} // allow slightly more typing but block validation
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setErrors(prev => ({ ...prev, description: '' }));
                  }}
                  placeholder="Tell us what happened, where you noticed it, and anything else that may help."
                  className={`w-full text-xs border rounded px-3 py-2 bg-white text-civic-navy focus:outline-none focus:ring-1 focus:ring-civic-action ${
                    errors.description ? 'border-red-500' : 'border-civic-border'
                  }`}
                />
                {errors.description && (
                  <span className="text-[10px] text-red-600 font-semibold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-red-500" /> {errors.description}
                  </span>
                )}
              </div>

            </div>
          </div>

          {/* SECTION 2 — ADD A PHOTO */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-civic-navy uppercase tracking-wider border-b border-slate-100 pb-2">
              02 &bull; Add a photo
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              
              {/* Upload area */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-civic-navy mb-1.5">
                  Attach Image
                </label>
                
                <div className="relative border-2 border-dashed border-slate-200 rounded-lg p-5 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center gap-2">
                  <input 
                    type="file"
                    ref={fileInputRef}
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handlePhotoChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="Choose files to upload"
                  />
                  <UploadCloud className="w-8 h-8 text-slate-400" />
                  <span className="text-xs font-bold text-civic-navy block">Upload photo</span>
                  <span className="text-[10px] text-civic-muted leading-tight">JPG, PNG or WEBP (Max 5MB)</span>
                </div>

                {photoError && (
                  <span className="text-[10px] text-red-600 font-semibold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-red-500" /> {photoError}
                  </span>
                )}
              </div>

              {/* Photo preview container */}
              <div className="md:col-span-2">
                {photo ? (
                  <div className="flex items-center gap-4 bg-slate-50 border border-civic-border rounded-lg p-3">
                    <div className="w-20 h-20 rounded border border-slate-200 overflow-hidden bg-white flex-shrink-0">
                      <img 
                        src={photoPreview} 
                        alt="Issue upload preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-grow space-y-1 text-xs">
                      <div className="font-bold text-civic-navy truncate max-w-sm">{photo.name}</div>
                      <div className="text-[10px] text-civic-muted font-mono">{(photo.size / 1024 / 1024).toFixed(2)} MB</div>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="text-[10px] font-bold text-red-600 hover:text-red-700 flex items-center gap-0.5 focus:outline-none cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg p-5 flex items-center justify-center gap-3 text-civic-muted bg-slate-50/20 text-xs">
                    <ImageIcon className="w-5 h-5 text-slate-300" />
                    <span>Photos help JanSetu AI dispatchers categorize the issue correctly. (Optional)</span>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* SECTION 3 — WHERE IS THE ISSUE? */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-civic-navy uppercase tracking-wider border-b border-slate-100 pb-2">
              03 &bull; Where is the issue?
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column Address Input */}
              <div className="space-y-4">
                
                {/* Geolocation Button */}
                <div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleUseMyLocation}
                    icon={Navigation}
                    className="w-full text-xs font-bold"
                  >
                    Use My Location
                  </Button>
                  {geolocationError && (
                    <span className="text-[10px] text-red-600 font-semibold mt-1.5 block">
                      ⚠️ {geolocationError}
                    </span>
                  )}
                </div>

                {/* Address Address */}
                <div>
                  <label htmlFor="address" className="block text-xs font-bold uppercase tracking-wider text-civic-navy mb-1.5">
                    Location / Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="address"
                    required
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setErrors(prev => ({ ...prev, location: '' }));
                    }}
                    placeholder="e.g. 540 Market St, San Francisco"
                    className={`w-full text-xs border rounded px-3 py-2.5 bg-white text-civic-navy focus:outline-none focus:ring-1 focus:ring-civic-action ${
                      errors.location ? 'border-red-500' : 'border-civic-border'
                    }`}
                  />
                  {errors.location && (
                    <span className="text-[10px] text-red-600 font-semibold mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-red-500" /> {errors.location}
                    </span>
                  )}
                </div>

                {/* Ward Ward */}
                <div>
                  <label htmlFor="ward" className="block text-xs font-bold uppercase tracking-wider text-civic-navy mb-1.5">
                    Municipal District / Ward <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="ward"
                    value={ward}
                    onChange={(e) => {
                      setWard(e.target.value);
                      setErrors(prev => ({ ...prev, ward: '' }));
                    }}
                    className={`w-full text-xs border rounded px-3 py-2.5 bg-white text-civic-navy focus:outline-none focus:ring-1 focus:ring-civic-action cursor-pointer ${
                      errors.ward ? 'border-red-500' : 'border-civic-border'
                    }`}
                  >
                    <option value="">Select Ward</option>
                    <option value="District 1">District 1</option>
                    <option value="District 2">District 2</option>
                    <option value="District 3">District 3</option>
                    <option value="District 4">District 4</option>
                    <option value="District 5">District 5</option>
                    <option value="District 6">District 6</option>
                    <option value="District 7">District 7</option>
                    <option value="District 8">District 8</option>
                    <option value="District 9">District 9</option>
                  </select>
                  {errors.ward && (
                    <span className="text-[10px] text-red-600 font-semibold mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-red-500" /> {errors.ward}
                    </span>
                  )}
                </div>

                {/* Coordinate feedback */}
                {lat !== null && lng !== null ? (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-[10px] font-semibold text-civic-action flex items-center gap-1.5 leading-snug">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>Location Coordinates: Lat {lat.toFixed(4)}, Lng {lng.toFixed(4)} (Dropped pin)</span>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg p-3 text-[10px] text-civic-muted bg-slate-50/20 leading-snug flex items-start gap-1">
                    <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span>Select the issue location on the map. Default coordinate settings will apply if left blank.</span>
                  </div>
                )}

              </div>

              {/* Right Column Map Picker */}
              <div className="h-56 md:h-full min-h-[220px] rounded-lg overflow-hidden border border-civic-border relative z-10">
                <MapContainer
                  center={defaultCenter}
                  zoom={13}
                  className="w-full h-full"
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  />
                  
                  {/* click event listener */}
                  <MapClickHandler onLocationPick={handleMapLocationPick} />
                  
                  {/* render dropped marker */}
                  {lat !== null && lng !== null && (
                    <Marker position={[lat, lng]} icon={customMarkerIcon} />
                  )}

                  {/* Recenter helper on locate */}
                  {lat !== null && lng !== null && (
                    <MapRecenter center={[lat, lng]} />
                  )}
                </MapContainer>
              </div>

            </div>
          </div>

          {/* SECTION 4 — ADDITIONAL DETAILS */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-civic-navy uppercase tracking-wider border-b border-slate-100 pb-2">
              04 &bull; Additional Details (Optional)
            </h3>
            
            <div>
              <label htmlFor="additionalDetails" className="block text-xs font-bold uppercase tracking-wider text-civic-navy mb-1.5">
                Additional Comments
              </label>
              <textarea
                id="additionalDetails"
                rows={3}
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                placeholder="Include landmark cues (e.g. adjacent park bench, nearby building names) that can help crew members find the issue."
                className="w-full text-xs border border-civic-border rounded px-3 py-2 bg-white text-civic-navy focus:outline-none focus:ring-1 focus:ring-civic-action"
              />
            </div>
          </div>

          {/* SECTION 5 - REPORT SUMMARY PANEL */}
          {category && description.trim() && (address.trim() || lat !== null) && ward && (
            <div className="bg-slate-50 border border-civic-border rounded-lg p-4 text-xs font-sans text-civic-navy space-y-2">
              <span className="text-[10px] font-bold text-civic-muted uppercase tracking-wider">Report Summary Preview</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 leading-relaxed text-[11px]">
                <div>
                  <span className="text-civic-muted">Category:</span> <strong className="font-bold">{category}</strong>
                </div>
                <div>
                  <span className="text-civic-muted">Location:</span> <strong className="font-bold">{ward} &bull; {address.slice(0, 16)}{address.length > 16 ? '...' : ''}</strong>
                </div>
                <div>
                  <span className="text-civic-muted">Photo:</span> <strong className="font-bold">{photo ? 'Attached (Preview)' : 'None'}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Submission CTA footer */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
            <Link to="/">
              <Button variant="secondary" size="md">
                Cancel
              </Button>
            </Link>
            <Button 
              type="submit" 
              variant="primary" 
              size="md" 
              icon={CheckCircle2}
              className="cursor-pointer"
            >
              Submit Report
            </Button>
          </div>

        </form>
      </div>
    </Container>
  );
};

export default Report;
