import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useCivic } from '../../context/CivicContext';
import { complaintAPI } from '../../services/api';
import { getStatusConfig, getStatusHistory, normalizeStatus } from '../../utils/statusConfig';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import { 
  ChevronLeft, 
  MapPin, 
  Building2, 
  Brain, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  Check, 
  X,
  AlertTriangle
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

// Leaflet custom marker icon
const adminMarkerIcon = L.divIcon({
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1769E0" width="32" height="32">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `,
  className: 'custom-admin-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const AdminIssueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    issues, updateIssueStatus, updateIssuePriority, assignDepartment, 
    assignWorker, workersList, fetchWorkers, fetchComplaints 
  } = useCivic();

  const [selectedWorkerId, setSelectedWorkerId] = useState('');

  React.useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const handleCloseComplaint = async () => {
    if (!currentIssue) return;
    try {
      await complaintAPI.close(currentIssue.id || currentIssue._id);
      fetchComplaints();
      showToast('Complaint officially CLOSED.');
    } catch (err) {
      showToast(err.message || 'Closure failed');
    }
  };

  const handleAssignWorker = async () => {
    if (!currentIssue || !selectedWorkerId) {
      showToast('Please select a field worker first', 'error');
      return;
    }
    try {
      await assignWorker(currentIssue.id || currentIssue._id, selectedWorkerId, 'Worker dispatched by municipal administrator.');
      fetchComplaints();
      showToast('Worker assigned successfully!');
    } catch (err) {
      showToast(err.message || 'Worker assignment failed');
    }
  };

  const currentIssue = issues.find(i => 
    (i.id && String(i.id).toUpperCase() === (id || '').toUpperCase()) ||
    (i._id && String(i._id).toUpperCase() === (id || '').toUpperCase()) ||
    (i.code && String(i.code).toUpperCase() === (id || '').toUpperCase())
  );

  // Sync selected worker ID when currentIssue is loaded
  React.useEffect(() => {
    if (currentIssue?.assignedWorker) {
      const wId = typeof currentIssue.assignedWorker === 'object' 
        ? (currentIssue.assignedWorker._id || currentIssue.assignedWorker.id)
        : currentIssue.assignedWorker;
      setSelectedWorkerId(wId || '');
    }
  }, [currentIssue]);

  // Modal & Form States
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [resolutionNoteInput, setResolutionNoteInput] = useState('');
  const [resolutionNoteError, setResolutionNoteError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  if (!currentIssue) {
    return (
      <div className="bg-white border border-civic-border rounded-xl p-8 text-center space-y-4 max-w-lg mx-auto my-12 text-left">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#10213F]">REPORT NOT FOUND</h2>
        <p className="text-xs text-civic-muted">
          No civic report was found matching ID <strong className="font-mono text-[#10213F]">{id}</strong>.
        </p>
        <Link to="/admin/issues" className="inline-block bg-civic-action text-white text-xs font-bold px-4 py-2 rounded-lg">
          Back to Issues List
        </Link>
      </div>
    );
  }

  const normalizedStatus = normalizeStatus(currentIssue.status);
  const statusConfig = getStatusConfig(normalizedStatus);
  const statusTimeline = getStatusHistory(currentIssue);

  const defaultLat = currentIssue.location?.lat || 37.7749;
  const defaultLng = currentIssue.location?.lng || -122.4194;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Department change handler
  const handleDepartmentChange = (dept) => {
    assignDepartment(currentIssue.id || currentIssue._id, dept);
    showToast(`Department updated to ${dept}.`);
  };

  // Priority change handler
  const handlePriorityChange = (prio) => {
    const backendPrio = String(prio).toUpperCase();
    updateIssuePriority(currentIssue.id || currentIssue._id, backendPrio);
    showToast(`Priority updated to ${prio}.`);
  };

  // Trigger Status Modal
  const openStatusConfirmModal = (nextSt) => {
    setTargetStatus(nextSt);
    setResolutionNoteInput(currentIssue.resolutionNote || '');
    setResolutionNoteError('');
    setShowStatusModal(true);
  };

  // Execute Status Transition
  const handleConfirmStatusChange = () => {
    if (targetStatus === 'Resolved' || targetStatus === 'RESOLVED') {
      if (!resolutionNoteInput.trim() || resolutionNoteInput.trim().length < 5) {
        setResolutionNoteError('Resolution note is required and must be at least 5 characters.');
        return;
      }
    }

    const backendStatusMap = {
      'Reported': 'REPORTED',
      'AI Analyzed': 'UNDER_REVIEW',
      'Under Review': 'UNDER_REVIEW',
      'Assigned': 'ASSIGNED',
      'In Progress': 'IN_PROGRESS',
      'Resolved': 'RESOLVED'
    };

    const targetBackendStatus = backendStatusMap[targetStatus] || String(targetStatus).toUpperCase();

    updateIssueStatus(currentIssue.id || currentIssue._id, targetBackendStatus, resolutionNoteInput.trim());

    setShowStatusModal(false);
    showToast(`Status updated to "${targetStatus}".`);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '12 Aug 2026';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '12 Aug 2026';
    }
  };

  return (
    <div className="space-y-6 font-sans text-left relative">
      
      {/* Toast Confirmation Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#10213F] text-white text-xs font-bold px-4 py-3 rounded-lg shadow-lg border border-blue-400 flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Back Link & Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-civic-border pb-4">
        <div>
          <Link to="/admin/issues" className="inline-flex items-center gap-1 text-xs text-civic-muted hover:text-civic-navy font-semibold mb-2">
            <ChevronLeft className="w-3.5 h-3.5" /> Back to Issues Management
          </Link>
          <div className="flex items-center gap-3">
            <span className="font-mono text-base font-extrabold text-civic-action bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded">
              {currentIssue.id}
            </span>
            <h1 className="text-xl font-extrabold text-[#10213F] tracking-tight">
              {currentIssue.title}
            </h1>
          </div>
        </div>

        {/* Header Badges */}
        <div className="flex items-center gap-2">
          <PriorityBadge priority={currentIssue.priority} />
          <StatusBadge status={currentIssue.status} />
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Main Issue Information, AI Analysis, Timeline (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ISSUE INFORMATION CARD */}
          <div className="bg-white border border-civic-border rounded-xl p-6 shadow-civic-subtle space-y-5">
            <h2 className="text-xs font-bold text-[#10213F] uppercase tracking-wider border-b border-slate-100 pb-2">
              Report Information & Evidence
            </h2>

            <div className="flex flex-col sm:flex-row justify-between gap-6">
              <div className="space-y-3 text-xs text-[#10213F] flex-1">
                <div>
                  <span className="block text-[10px] font-bold text-civic-muted uppercase tracking-wider">
                    Detailed Description
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed mt-1 bg-slate-50 border border-slate-200 p-3 rounded-lg">
                    "{currentIssue.description}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="block text-[10px] font-bold text-civic-muted uppercase tracking-wider">Category</span>
                    <span className="font-bold text-xs">{currentIssue.category}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-civic-muted uppercase tracking-wider">Municipal Ward</span>
                    <span className="font-bold text-xs">{currentIssue.ward}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[10px] font-bold text-civic-muted uppercase tracking-wider">Reported Date</span>
                    <span className="font-mono text-[11px] text-slate-600">{formatDate(currentIssue.createdAt)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-civic-muted uppercase tracking-wider">Last System Update</span>
                    <span className="font-mono text-[11px] text-slate-600">{formatDate(currentIssue.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Citizen Photo Thumbnail */}
              {currentIssue.image && (
                <div className="w-40 h-40 rounded-lg border border-slate-200 overflow-hidden flex-shrink-0 bg-slate-100 shadow-xs space-y-1">
                  <img 
                    src={currentIssue.image} 
                    alt="Citizen submitted report evidence" 
                    className="w-full h-full object-cover"
                  />
                  <span className="block text-[9px] text-center text-civic-muted font-mono">Citizen Evidence Photo</span>
                </div>
              )}
            </div>
          </div>

          {/* CIVICAI ANALYSIS CARD */}
          <div className="bg-white border border-civic-border rounded-xl p-6 shadow-civic-subtle space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold text-[#10213F] uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-civic-action" /> JanSetu AI Automated Assessment
              </h2>
              {currentIssue.aiAnalysis && (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono">
                  {currentIssue.aiAnalysis.confidence || '94%'} Confidence
                </span>
              )}
            </div>

            {currentIssue.aiAnalysis ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans text-[#10213F]">
                <div>
                  <span className="block text-[10px] font-bold text-civic-muted uppercase tracking-wider">Detected Issue</span>
                  <span className="font-bold">{currentIssue.aiAnalysis.detectedIssue}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-civic-muted uppercase tracking-wider">Recommended Dept</span>
                  <span className="font-bold text-civic-action">{currentIssue.aiAnalysis.recommendedDepartment}</span>
                </div>
                <div className="col-span-2 bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-xs text-civic-navy leading-relaxed">
                  <strong>Assessment Reasoning:</strong> {currentIssue.aiAnalysis.reasoning}
                </div>
              </div>
            ) : (
              <div className="text-xs text-civic-muted bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
                AI analysis is not available for this report.
              </div>
            )}
          </div>

          {/* STATUS LIFECYCLE TIMELINE CARD */}
          <div className="bg-white border border-civic-border rounded-xl p-6 shadow-civic-subtle space-y-5">
            <h2 className="text-xs font-bold text-[#10213F] uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-civic-action" /> Resolution Status Lifecycle
            </h2>

            <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {statusTimeline.map((step) => {
                const IconComponent = step.icon;
                return (
                  <div key={step.key} className="flex items-start gap-4 relative z-10">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                      step.isCompleted ? 'bg-emerald-600 text-white' :
                      step.isCurrent ? 'bg-civic-action text-white ring-4 ring-blue-100' :
                      'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}>
                      {step.isCompleted ? <Check className="w-4 h-4" /> : <IconComponent className="w-3.5 h-3.5" />}
                    </div>

                    <div className="flex-grow space-y-0.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className={`font-bold ${
                          step.isCompleted ? 'text-[#10213F]' :
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
          </div>

        </div>

        {/* RIGHT COLUMN: Priority, Department Assignment, Status Management, Location Map (1 col) */}
        <div className="space-y-6">
          
          {/* DEPARTMENT ASSIGNMENT CARD */}
          <div className="bg-white border border-civic-border rounded-xl p-5 shadow-civic-subtle space-y-3">
            <span className="text-[10px] font-bold text-civic-muted uppercase tracking-wider block flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-civic-action" /> Department Assignment
            </span>

            <div>
              <label htmlFor="deptSelect" className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Select Responsible Department
              </label>
              <select
                id="deptSelect"
                value={currentIssue.assignedDepartment || currentIssue.aiAnalysis?.recommendedDepartment || ''}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full text-xs font-bold text-[#10213F] bg-slate-50 border border-civic-border rounded-lg px-3 py-2.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-civic-action"
              >
                <option value="" disabled>Select Department</option>
                {DEPARTMENT_OPTIONS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="text-[11px] text-civic-muted bg-slate-50 p-2.5 rounded border border-slate-200 leading-tight">
              Assigning routes this worksheet directly to field maintenance dispatchers.
            </div>
          </div>

          {/* FIELD WORKER ASSIGNMENT CARD */}
          <div className="bg-white border border-civic-border rounded-xl p-5 shadow-civic-subtle space-y-3">
            <span className="text-[10px] font-bold text-civic-muted uppercase tracking-wider block flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-civic-action" /> Assign Field Worker
            </span>

            <div>
              <label htmlFor="workerSelect" className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Select Field Worker / Officer
              </label>
              <select
                id="workerSelect"
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                className="w-full text-xs font-bold text-[#10213F] bg-slate-50 border border-civic-border rounded-lg px-3 py-2.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-civic-action"
              >
                <option value="">Select Field Worker...</option>
                {workersList.map(w => (
                  <option key={w._id || w.id} value={w._id || w.id}>
                    {w.name} ({w.email}) &bull; {w.department || 'Field Ops'}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAssignWorker}
              className="w-full bg-[#10213F] hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
            >
              Assign Selected Field Worker
            </button>
          </div>

          {/* PRIORITY ASSESSMENT CARD */}
          <div className="bg-white border border-civic-border rounded-xl p-5 shadow-civic-subtle space-y-3">
            <span className="text-[10px] font-bold text-civic-muted uppercase tracking-wider block flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Operational Priority Level
            </span>

            <div>
              <select
                value={currentIssue.priority || 'Medium'}
                onChange={(e) => handlePriorityChange(e.target.value)}
                className="w-full text-xs font-bold text-[#10213F] bg-slate-50 border border-civic-border rounded-lg px-3 py-2.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-civic-action"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
          </div>

          {/* STATUS WORKFLOW CONTROL CARD */}
          <div className="bg-white border border-civic-border rounded-xl p-5 shadow-civic-subtle space-y-4">
            <span className="text-[10px] font-bold text-civic-muted uppercase tracking-wider block">
              WORKFLOW STATUS ACTION
            </span>

            {/* Quick Action Button based on preferred progression */}
            {normalizedStatus === 'Reported' && (
              <button
                onClick={() => openStatusConfirmModal('AI Analyzed')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
              >
                Run AI Analysis Stage
              </button>
            )}

            {(normalizedStatus === 'AI Analyzed' || normalizedStatus === 'Under Review') && (
              <button
                onClick={() => openStatusConfirmModal('Assigned')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
              >
                Assign Issue
              </button>
            )}

            {normalizedStatus === 'Assigned' && (
              <button
                onClick={() => openStatusConfirmModal('In Progress')}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
              >
                Start Work
              </button>
            )}

            {normalizedStatus === 'In Progress' && (
              <button
                onClick={() => openStatusConfirmModal('Resolved')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
              >
                Mark Resolved
              </button>
            )}

            {(currentIssue.status === 'VERIFIED' || normalizedStatus === 'Verified') && (
              <button
                onClick={handleCloseComplaint}
                className="w-full bg-slate-900 hover:bg-black text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-colors cursor-pointer shadow-xs border border-slate-700"
              >
                CLOSE COMPLAINT (OFFICIAL)
              </button>
            )}

            {currentIssue.status === 'CLOSED' && (
              <div className="bg-slate-900 text-white rounded-lg p-3 text-center space-y-1">
                <span className="text-xs font-bold flex items-center justify-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" /> COMPLAINT OFFICIALLY CLOSED
                </span>
                <p className="text-[10px] text-slate-300 leading-tight">
                  Lifecycle complete. Archived in municipal registry.
                </p>
              </div>
            )}

            {normalizedStatus === 'Resolved' && currentIssue.status !== 'VERIFIED' && currentIssue.status !== 'CLOSED' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center space-y-1">
                <span className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Issue Resolved
                </span>
                <p className="text-[11px] text-emerald-700 leading-tight">
                  This report has been marked resolved. Awaiting citizen verification.
                </p>
              </div>
            )}

            {/* Manual Status Override Select */}
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <label htmlFor="manualStatus" className="block text-[10px] font-bold text-slate-400 uppercase">
                Manual Status Override
              </label>
              <select
                id="manualStatus"
                value={currentIssue.status}
                onChange={(e) => openStatusConfirmModal(e.target.value)}
                className="w-full text-xs font-semibold text-[#10213F] bg-slate-50 border border-civic-border rounded-md px-2.5 py-1.5 cursor-pointer"
              >
                <option value="Reported">Reported</option>
                <option value="AI Analyzed">AI Analyzed</option>
                <option value="Under Review">Under Review</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* MINI LOCATION MAP */}
          <div className="bg-white border border-civic-border rounded-xl p-5 shadow-civic-subtle space-y-3">
            <span className="text-[10px] font-bold text-civic-muted uppercase tracking-wider block flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-civic-action" /> Incident Coordinates
            </span>

            <div className="h-44 rounded-lg overflow-hidden border border-civic-border relative z-10">
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
                <Marker position={[defaultLat, defaultLng]} icon={adminMarkerIcon}>
                  <Popup>
                    <div className="text-xs font-sans">
                      <strong className="block font-bold">{currentIssue.title}</strong>
                      <span className="text-[10px] text-slate-500 block">{currentIssue.ward}</span>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>

            <div className="text-[11px] text-civic-muted">
              {currentIssue.location?.address || currentIssue.locationText || 'Nagpur Municipal Ward Sector'}
            </div>
          </div>

        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* ACCESSIBLE STATUS UPDATE CONFIRMATION MODAL */}
      {/* ------------------------------------------------------------- */}
      {showStatusModal && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setShowStatusModal(false);
          }}
        >
          <div className="bg-white border border-civic-border rounded-xl max-w-md w-full p-6 shadow-xl space-y-4 text-left animate-in fade-in zoom-in duration-150">
            
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-civic-action uppercase tracking-widest block font-mono">
                  CONFIRM STATUS UPDATE
                </span>
                <h3 className="text-base font-bold text-[#10213F]">
                  Update Status to "{targetStatus}"?
                </h3>
              </div>
              <button 
                onClick={() => setShowStatusModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-civic-muted leading-relaxed">
              This action will update the report lifecycle status and will be immediately reflected on the public citizen tracking portal.
            </p>

            {/* Resolution Note Input Required when targetStatus is 'Resolved' */}
            {targetStatus === 'Resolved' && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label htmlFor="resNoteInput" className="block text-xs font-bold text-[#10213F]">
                  Resolution Note <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="resNoteInput"
                  rows={3}
                  value={resolutionNoteInput}
                  onChange={(e) => {
                    setResolutionNoteInput(e.target.value);
                    setResolutionNoteError('');
                  }}
                  placeholder="Describe what action was taken to resolve the issue (e.g., Road surface resurfaced, debris cleared, inspection completed)."
                  className="w-full text-xs border border-civic-border rounded-lg p-3 text-[#10213F] focus:outline-none focus:ring-1 focus:ring-civic-action bg-white"
                />
                {resolutionNoteError && (
                  <p className="text-[11px] font-bold text-red-600">{resolutionNoteError}</p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-civic-navy text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                className="bg-civic-action hover:bg-civic-action-hover text-white text-xs font-bold px-5 py-2 rounded-lg cursor-pointer transition-colors shadow-xs"
              >
                Confirm Update
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminIssueDetail;
