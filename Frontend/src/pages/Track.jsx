import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useCivic } from '../context/CivicContext';
import { complaintAPI } from '../services/api';
import { getStatusConfig, getStatusHistory, normalizeStatus } from '../utils/statusConfig';
import Container from '../components/Container';
import Button from '../components/Button';
import SectionHeading from '../components/SectionHeading';
import PriorityBadge from '../components/PriorityBadge';
import { 
  Search, ChevronLeft, Copy, Check, MapPin, Building2, 
  Clock, ShieldCheck, AlertCircle, ArrowRight, Brain, 
  ThumbsUp, ThumbsDown, Eye, HelpCircle, FileText
} from 'lucide-react';

// Custom Marker Icon for Leaflet Map
const trackingMarkerIcon = L.divIcon({
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1769E0" width="32" height="32">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `,
  className: 'custom-tracking-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const Track = () => {
  const { issues, updateCitizenFeedback, currentUser, fetchComplaints, showToast } = useCivic();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const targetId = searchParams.get('id');

  // Local states
  const [searchInput, setSearchInput] = useState('');
  const [searchError, setSearchError] = useState('');
  const [showCopyIdToast, setShowCopyIdToast] = useState(false);
  const [showCopyLinkToast, setShowCopyLinkToast] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const handleVerifyApprove = async () => {
    if (!currentIssue) return;
    try {
      await complaintAPI.verifyResolution(currentIssue.id || currentIssue._id, { approved: true, note: 'Resolution approved and verified by citizen.' });
      fetchComplaints();
      showToast('Complaint resolution approved & verified!', 'success');
    } catch (err) {
      showToast(err.message || 'Verification failed', 'error');
    }
  };

  const handleVerifyReject = async () => {
    if (!currentIssue) return;
    try {
      await complaintAPI.verifyResolution(currentIssue.id || currentIssue._id, { approved: false, note: 'Resolution rejected by citizen. Issue still requires attention.' });
      fetchComplaints();
      showToast('Complaint reopened for further review.', 'info');
    } catch (err) {
      showToast(err.message || 'Rejection failed', 'error');
    }
  };

  // Find issue by targetId
  const currentIssue = targetId ? issues.find(i => 
    (i.id && String(i.id).toUpperCase() === targetId.toUpperCase()) ||
    (i._id && String(i._id).toUpperCase() === targetId.toUpperCase()) ||
    (i.code && String(i.code).toUpperCase() === targetId.toUpperCase()) ||
    (i.displayId && String(i.displayId).toUpperCase() === targetId.toUpperCase())
  ) : null;

  const isOwnReport = currentUser && currentIssue && (
    currentIssue.reportedBy === currentUser._id || 
    currentIssue.reportedBy === currentUser.id ||
    currentUser.role === 'admin'
  );

  // Handle Search submit in State 1
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchError('');
    
    const query = searchInput.trim().toUpperCase();
    if (!query) {
      setSearchError('Please enter a valid report ID.');
      return;
    }

    const matched = issues.find(i => 
      (i.id && String(i.id).toUpperCase() === query) ||
      (i._id && String(i._id).toUpperCase() === query) ||
      (i.code && String(i.code).toUpperCase() === query) ||
      (i.displayId && String(i.displayId).toUpperCase() === query)
    );
    if (matched) {
      setSearchParams({ id: matched.code || matched.id });
    } else {
      setSearchError(`No report found with ID "${query}". Please verify the ID and try again.`);
    }
  };

  // Copy ID
  const handleCopyId = () => {
    if (!currentIssue) return;
    navigator.clipboard.writeText(currentIssue.id).then(() => {
      setShowCopyIdToast(true);
      setTimeout(() => setShowCopyIdToast(false), 2000);
    });
  };

  // Copy Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShowCopyLinkToast(true);
      setTimeout(() => setShowCopyLinkToast(false), 2000);
    });
  };

  // Handle Citizen Feedback for resolved issues
  const handleFeedback = (rating) => {
    if (!currentIssue) return;
    updateCitizenFeedback(currentIssue.id, rating);
    setFeedbackSubmitted(true);
  };

  // Default SF Map Center if issue coordinates unavailable
  const defaultLat = currentIssue?.location?.lat || 37.7749;
  const defaultLng = currentIssue?.location?.lng || -122.4194;

  // -------------------------------------------------------------
  // ENTRY STATE 1 — NO REPORT ID IN QUERY PARAM OR INVALID
  // -------------------------------------------------------------
  if (!targetId || (!currentIssue && searchError)) {
    return (
      <Container className="max-w-2xl py-8 font-sans text-left">
        
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-civic-muted hover:text-civic-navy font-semibold mb-6">
          <ChevronLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>

        <SectionHeading 
          title="Track Your Report" 
          subtitle="Enter your CivicAI report ID to see the latest status, priority rating, AI analysis details, and resolution timeline of your issue."
        />

        {/* Search Box Card */}
        <div className="bg-white border border-civic-border rounded-xl shadow-civic-subtle p-6 sm:p-8 space-y-6">
          
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <label htmlFor="idInput" className="block text-xs font-bold uppercase tracking-wider text-civic-navy">
              Report ID <span className="text-red-500">*</span>
            </label>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                id="idInput"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setSearchError('');
                }}
                placeholder="e.g. CIV-2026-004281"
                className="flex-grow text-sm border border-civic-border rounded px-3.5 py-2.5 bg-white text-civic-navy font-mono focus:outline-none focus:ring-1 focus:ring-civic-action"
              />
              <Button type="submit" variant="primary" size="md" icon={Search} className="cursor-pointer">
                Track Report
              </Button>
            </div>

            {searchError && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block">Report Not Found</strong>
                  <span>{searchError}</span>
                </div>
              </div>
            )}
          </form>

          {/* Quick Select Recent Reports */}
          {issues && issues.length > 0 && (
            <div className="border-t border-slate-100 pt-6 space-y-3">
              <span className="text-[11px] font-bold text-civic-muted uppercase tracking-wider block">
                Or Select a Sample Report to Inspect:
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {issues.slice(0, 6).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSearchParams({ id: item.id })}
                    className="text-left bg-slate-50 hover:bg-blue-50/60 border border-civic-border hover:border-blue-200 rounded-lg p-3 transition-colors cursor-pointer space-y-1"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono font-bold text-civic-navy">{item.id}</span>
                      <span className="text-[10px] font-bold text-civic-action bg-blue-50 px-1.5 py-0.5 rounded">
                        {item.status}
                      </span>
                    </div>
                    <div className="text-[11px] font-semibold text-civic-navy truncate">{item.category} &bull; {item.ward}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

      </Container>
    );
  }

  // Handle Invalid Query Param ID where user hasn't typed in form yet
  if (!currentIssue) {
    return (
      <Container className="max-w-md py-12 font-sans text-left">
        <div className="bg-white border border-civic-border rounded-xl p-8 text-center shadow-civic-normal space-y-5">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-50 text-red-600 border border-red-100 mb-2">
            <AlertCircle className="h-6.5 w-6.5" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-civic-navy font-sans">Report Not Found</h2>
          <p className="text-xs text-civic-muted leading-relaxed">
            We couldn't find a report matching ID <strong className="font-mono text-civic-navy">{targetId}</strong>. The report may have been removed or the ID may be incorrect.
          </p>
          <div className="space-y-2 pt-2">
            <Button 
              variant="primary" 
              size="md" 
              className="w-full font-bold cursor-pointer"
              onClick={() => setSearchParams({})}
            >
              Search Another Report
            </Button>
            <Link to="/" className="block">
              <Button variant="secondary" size="md" className="w-full font-semibold">
                Return Home
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  // -------------------------------------------------------------
  // ENTRY STATE 2 — VALID REPORT ID FOUND
  // -------------------------------------------------------------

  const normalizedStatus = normalizeStatus(currentIssue.status);
  const statusConfig = getStatusConfig(normalizedStatus);
  const statusTimeline = getStatusHistory(currentIssue);
  const isResolved = normalizedStatus === 'Resolved';

  return (
    <Container className="max-w-4xl text-left py-4 font-sans space-y-8">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-civic-border pb-4">
        <div>
          <button 
            onClick={() => setSearchParams({})}
            className="inline-flex items-center gap-1 text-xs text-civic-muted hover:text-civic-navy font-semibold mb-2 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Track Another Report
          </button>
          <span className="text-[10px] font-bold text-civic-action uppercase tracking-wider block font-mono">
            CIVICAI DISPATCH TRACKING
          </span>
          <h1 className="text-2xl font-extrabold text-civic-navy tracking-tight mt-0.5">
            Track Your Report
          </h1>
        </div>

        {/* Identification pills */}
        <div className="flex flex-wrap items-center gap-2">
          {isOwnReport && (
            <div className="bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs px-2.5 py-1 rounded font-mono">
              YOUR REPORT
            </div>
          )}
          <div className="bg-slate-100 text-civic-navy font-mono text-xs font-bold px-3 py-1.5 rounded border border-slate-200">
            {currentIssue.id}
          </div>
          <div className="bg-blue-50 text-blue-700 font-bold text-xs px-3 py-1.5 rounded border border-blue-100">
            {statusConfig.label}
          </div>
          <PriorityBadge priority={currentIssue.priority} />
        </div>
      </div>

      {/* RESOLVED STATE BANNER (Renders when issue status is Resolved) */}
      {isResolved && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 shadow-civic-subtle space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 bg-emerald-100 text-emerald-700 p-2 rounded-full mt-0.5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-emerald-950 font-sans">ISSUE RESOLVED</h3>
              <p className="text-xs text-emerald-800 leading-relaxed">
                The reported civic issue has been addressed and restored by municipal public works crews.
              </p>
              {currentIssue.resolutionNote && (
                <div className="text-xs text-emerald-900 bg-emerald-100/60 p-3 rounded-lg border border-emerald-200 mt-2 font-medium">
                  <strong>Resolution Notes:</strong> {currentIssue.resolutionNote}
                </div>
              )}
            </div>
          </div>

          {/* Citizen Satisfaction Feedback */}
          <div className="border-t border-emerald-200 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <span className="font-bold text-emerald-950">
              Was this issue resolved satisfactorily?
            </span>
            
            {feedbackSubmitted || currentIssue.citizenFeedback ? (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Thank you for your feedback! ({currentIssue.citizenFeedback === 'satisfied' ? 'Satisfied' : 'Feedback Logged'})
              </span>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => handleFeedback('satisfied')}
                  className="bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3 py-1.5 rounded inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" /> Yes, Satisfied
                </button>
                <button
                  onClick={() => handleFeedback('not_satisfied')}
                  className="bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3 py-1.5 rounded inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ThumbsDown className="w-3.5 h-3.5 text-emerald-600" /> Not Yet
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Main Issue Summary & Timeline (2 cols on Desktop) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Issue Summary Card */}
          <div className="bg-white border border-civic-border rounded-xl p-6 shadow-civic-subtle space-y-5">
            <h2 className="text-xs font-bold text-civic-navy uppercase tracking-wider border-b border-slate-100 pb-2">
              Issue Summary
            </h2>

            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="space-y-3 text-xs text-civic-navy">
                <div>
                  <span className="block text-[9px] font-bold text-civic-muted uppercase tracking-wide">Issue Title / Summary</span>
                  <span className="text-base font-bold text-civic-navy block mt-0.5">{currentIssue.title}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[9px] font-bold text-civic-muted uppercase tracking-wide">Category</span>
                    <span className="font-bold">{currentIssue.category}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-civic-muted uppercase tracking-wide">Municipal Ward</span>
                    <span className="font-bold">{currentIssue.ward}</span>
                  </div>
                </div>

                <div>
                  <span className="block text-[9px] font-bold text-civic-muted uppercase tracking-wide">Reported Address</span>
                  <span className="font-medium text-civic-muted block mt-0.5">{currentIssue.location?.address || currentIssue.locationText || 'Pinned Coordinates'}</span>
                </div>
              </div>

              {/* Photo Thumbnail */}
              {currentIssue.image && (
                <div className="w-28 h-28 rounded-lg border border-slate-200 overflow-hidden flex-shrink-0 bg-slate-50">
                  <img 
                    src={currentIssue.image} 
                    alt="Reported civic issue" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Current Status Block & Progress Bar */}
          <div className="bg-white border border-civic-border rounded-xl p-6 shadow-civic-subtle space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold text-civic-navy uppercase tracking-wider">
                Current Status: <span className="text-civic-action font-extrabold">{statusConfig.label}</span>
              </h2>
              <span className="text-xs font-bold font-mono text-civic-navy">{statusConfig.progress}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
              <div 
                className="bg-civic-action h-full rounded-full transition-all duration-500"
                style={{ width: `${statusConfig.progress}%` }}
              ></div>
            </div>

            <p className="text-xs text-civic-muted leading-relaxed pt-1">
              "{statusConfig.description}"
            </p>
          </div>

          {/* MAIN LIFECYCLE TIMELINE */}
          <div className="bg-white border border-civic-border rounded-xl p-6 shadow-civic-subtle space-y-6">
            <h2 className="text-xs font-bold text-civic-navy uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-civic-action" /> Resolution Lifecycle Timeline
            </h2>

            {/* Vertical timeline */}
            <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {statusTimeline.map((step) => {
                const IconComponent = step.icon;
                return (
                  <div key={step.key} className="flex items-start gap-4 relative z-10">
                    
                    {/* Status Circle Icon */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                      step.isCompleted ? 'bg-emerald-600 text-white shadow-xs' :
                      step.isCurrent ? 'bg-civic-action text-white ring-4 ring-blue-100' :
                      'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}>
                      {step.isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <IconComponent className="w-3.5 h-3.5" />
                      )}
                    </div>

                    {/* Status Text & Timestamp */}
                    <div className="flex-grow space-y-0.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className={`font-bold ${
                          step.isCompleted ? 'text-civic-navy' :
                          step.isCurrent ? 'text-civic-action font-extrabold text-sm' :
                          'text-slate-400 font-normal'
                        }`}>
                          0{step.order} &bull; {step.label}
                        </span>
                        <span className={`text-[10px] font-mono ${step.isUpcoming ? 'text-slate-400 font-normal' : 'text-civic-muted font-bold'}`}>
                          {step.dateText}
                        </span>
                      </div>
                      <p className={`text-[11px] leading-relaxed ${step.isUpcoming ? 'text-slate-400' : 'text-civic-muted'}`}>
                        {step.detailText}
                      </p>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Citizen Resolution Verification Panel */}
            {(currentIssue.status === 'RESOLVED' || normalizedStatus === 'Resolved') && (
              <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Resolution Verification Required</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  The municipal department has marked this issue as resolved. Please inspect the fix and approve or reopen the report.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={handleVerifyApprove}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-xs"
                  >
                    Approve & Verify Resolution
                  </button>
                  <button
                    onClick={handleVerifyReject}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors"
                  >
                    Reject & Reopen Report
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* CivicAI Analysis Summary (If available) */}
          <div className="bg-white border border-civic-border rounded-xl p-6 shadow-civic-subtle space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold text-civic-navy uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-civic-action" /> CivicAI Intelligence Summary
              </h2>
              {currentIssue.aiAnalysis && (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded font-mono">
                  {currentIssue.aiAnalysis.confidence} Confidence
                </span>
              )}
            </div>

            {currentIssue.aiAnalysis ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans text-civic-navy">
                <div>
                  <span className="block text-[9px] font-bold text-civic-muted uppercase tracking-wide">Detected Hazard</span>
                  <span className="font-bold">{currentIssue.aiAnalysis.detectedIssue}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-civic-muted uppercase tracking-wide">Recommended Department</span>
                  <span className="font-bold">{currentIssue.aiAnalysis.recommendedDepartment}</span>
                </div>
                <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-civic-muted leading-relaxed">
                  <strong>Assessment Reasoning:</strong> {currentIssue.aiAnalysis.reasoning}
                </div>
              </div>
            ) : (
              <div className="text-xs text-civic-muted flex items-center justify-between gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span>CivicAI analysis is not available for this report yet.</span>
                <Link to={`/analyze/${currentIssue.id}`}>
                  <Button variant="secondary" size="sm" icon={Brain} className="text-xs font-bold cursor-pointer">
                    Analyze Now
                  </Button>
                </Link>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Department, Location Map & Actions (1 col on Desktop) */}
        <div className="space-y-8">
          
          {/* Responsible Department Card */}
          <div className="bg-white border border-civic-border rounded-xl p-5 shadow-civic-subtle space-y-3">
            <span className="text-[10px] font-bold text-civic-muted uppercase tracking-wider block flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-civic-action" /> Responsible Department
            </span>
            
            <div className="text-sm font-bold text-civic-navy bg-slate-50 border border-slate-200 px-3 py-2 rounded">
              {currentIssue.aiAnalysis?.recommendedDepartment || currentIssue.assignedDepartment || 'Municipal Operations'}
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-[10px] text-civic-muted font-bold uppercase">Assignment Status</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                normalizedStatus === 'Reported' || normalizedStatus === 'AI Analyzed' || normalizedStatus === 'Under Review'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
              }`}>
                {normalizedStatus === 'Reported' || normalizedStatus === 'AI Analyzed' || normalizedStatus === 'Under Review'
                  ? 'Awaiting Assignment'
                  : 'Assigned & Active'}
              </span>
            </div>
          </div>

          {/* Read-Only Location Map */}
          <div className="bg-white border border-civic-border rounded-xl p-5 shadow-civic-subtle space-y-3">
            <span className="text-[10px] font-bold text-civic-muted uppercase tracking-wider block flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-civic-action" /> Issue Location Pin
            </span>
            
            <div className="h-48 rounded-lg overflow-hidden border border-civic-border relative z-10">
              <MapContainer
                center={[defaultLat, defaultLng]}
                zoom={14}
                className="w-full h-full"
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <Marker position={[defaultLat, defaultLng]} icon={trackingMarkerIcon}>
                  <Popup>
                    <div className="text-xs font-sans">
                      <strong className="block font-bold">{currentIssue.title}</strong>
                      <span className="text-[10px] text-slate-500 block">{currentIssue.ward}</span>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>

            <div className="text-[11px] font-medium text-civic-muted leading-tight">
              {currentIssue.location?.address || currentIssue.locationText || 'San Francisco Municipal District'}
            </div>
          </div>

          {/* What Happens Next Card */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-5 space-y-2">
            <span className="text-[10px] font-bold text-civic-action uppercase tracking-wider block font-mono">
              What Happens Next
            </span>
            <p className="text-xs text-civic-navy leading-relaxed">
              "{statusConfig.nextStep}"
            </p>
          </div>

          {/* Action Utilities Card */}
          <div className="bg-white border border-civic-border rounded-xl p-5 shadow-civic-subtle space-y-3">
            <span className="text-[10px] font-bold text-civic-muted uppercase tracking-wider block">
              Tracking Actions
            </span>

            <div className="space-y-2">
              <div className="relative">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleCopyId}
                  icon={showCopyIdToast ? Check : Copy}
                  className="w-full text-xs font-semibold cursor-pointer justify-center"
                >
                  {showCopyIdToast ? 'Report ID Copied' : 'Copy Report ID'}
                </Button>
              </div>

              <div className="relative">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleCopyLink}
                  icon={showCopyLinkToast ? Check : Copy}
                  className="w-full text-xs font-semibold cursor-pointer justify-center"
                >
                  {showCopyLinkToast ? 'Link Copied' : 'Copy Tracking Link'}
                </Button>
              </div>

              <Link to="/report" className="block">
                <Button variant="primary" size="sm" className="w-full text-xs font-bold justify-center cursor-pointer">
                  Report Another Issue
                </Button>
              </Link>
            </div>
          </div>

        </div>

      </div>

    </Container>
  );
};

export default Track;
