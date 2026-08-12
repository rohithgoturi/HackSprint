import React, { useState, useEffect, useCallback } from 'react';
import { useCivic } from '../context/CivicContext';
import { workerAPI, complaintAPI } from '../services/api';
import Container from '../components/Container';
import Button from '../components/Button';
import SectionHeading from '../components/SectionHeading';
import { 
  Wrench, CheckCircle2, PlayCircle, AlertTriangle, Clock, 
  MapPin, User, Calendar, ShieldAlert, ArrowRight, FileText, 
  UploadCloud, AlertCircle, RefreshCw, Check
} from 'lucide-react';

const WorkerDashboard = () => {
  const { currentUser, showToast } = useCivic();
  
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState({ assigned: 0, inProgress: 0, resolved: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Modal / Form state for submitting resolution
  const [resolutionModalOpen, setResolutionModalOpen] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolutionImage, setResolutionImage] = useState('');
  const [submittingResolution, setSubmittingResolution] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch tasks and summary for worker
  const loadWorkerData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, summaryRes] = await Promise.all([
        workerAPI.getMyTasks(),
        workerAPI.getSummary()
      ]);

      if (tasksRes.data && tasksRes.data.success) {
        setTasks(tasksRes.data.data || []);
      }
      if (summaryRes.data && summaryRes.data.success) {
        setSummary(summaryRes.data.data || { assigned: 0, inProgress: 0, resolved: 0, overdue: 0 });
      }
    } catch (err) {
      console.error('[Worker Data Error]', err);
      showToast(err.message || 'Failed to load worker tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadWorkerData();
  }, [loadWorkerData]);

  // Handle Start Work (ASSIGNED -> IN_PROGRESS)
  const handleStartWork = async (taskId) => {
    try {
      await complaintAPI.updateStatus(taskId, {
        status: 'IN_PROGRESS',
        note: `Field Worker ${currentUser?.name || ''} started work on this complaint.`
      });
      showToast('Work started on complaint! Status updated to IN_PROGRESS.', 'success');
      loadWorkerData();
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  // Open Resolution Modal
  const openResolutionModal = (task) => {
    setSelectedTask(task);
    setResolutionNote('');
    setResolutionImage('https://images.unsplash.com/photo-1542060748-10c28b629f6f?auto=format&fit=crop&w=800&q=80');
    setFormError('');
    setResolutionModalOpen(true);
  };

  // Submit Resolution Evidence
  const handleSubmitResolution = async (e) => {
    e.preventDefault();
    if (!resolutionNote.trim()) {
      setFormError('Please describe the resolution details and work completed.');
      return;
    }

    setSubmittingResolution(true);
    setFormError('');

    try {
      await complaintAPI.submitResolution(selectedTask._id || selectedTask.id, {
        note: resolutionNote.trim(),
        imageUrl: resolutionImage.trim() || null
      });

      showToast('Resolution evidence submitted successfully! Status updated to RESOLVED.', 'success');
      setResolutionModalOpen(false);
      setSelectedTask(null);
      loadWorkerData();
    } catch (err) {
      setFormError(err.message || 'Failed to submit resolution evidence.');
    } finally {
      setSubmittingResolution(false);
    }
  };

  // Filter tasks based on UI status tabs
  const filteredTasks = tasks.filter(task => {
    if (filterStatus === 'ALL') return true;
    return task.status === filterStatus;
  });

  return (
    <Container className="py-8 font-sans text-left space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-civic-border pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-full mb-2">
            <Wrench className="w-3.5 h-3.5" /> Field Worker Operations Portal
          </div>
          <h1 className="text-2xl font-extrabold text-[#10213F] tracking-tight">
            Field Officer Dashboard
          </h1>
          <p className="text-xs text-civic-muted mt-1">
            Logged in as <strong className="text-[#10213F]">{currentUser?.name}</strong> ({currentUser?.email}) &bull; {currentUser?.ward || 'District 3 Operations'}
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={loadWorkerData}
          icon={RefreshCw}
          className="text-xs font-semibold self-start md:self-auto cursor-pointer"
        >
          Refresh Dispatch Queue
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-civic-border rounded-xl p-5 shadow-civic-subtle">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-civic-muted uppercase tracking-wider">Assigned Tasks</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#10213F] mt-2 font-mono">{summary.assigned}</div>
          <span className="text-[10px] text-civic-muted block mt-1">Pending action initiation</span>
        </div>

        <div className="bg-white border border-civic-border rounded-xl p-5 shadow-civic-subtle">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-civic-muted uppercase tracking-wider">In Progress</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <PlayCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#10213F] mt-2 font-mono">{summary.inProgress}</div>
          <span className="text-[10px] text-civic-muted block mt-1">Under active repair</span>
        </div>

        <div className="bg-white border border-civic-border rounded-xl p-5 shadow-civic-subtle">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-civic-muted uppercase tracking-wider">Resolved</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#10213F] mt-2 font-mono">{summary.resolved}</div>
          <span className="text-[10px] text-civic-muted block mt-1">Awaiting citizen verification</span>
        </div>

        <div className="bg-white border border-civic-border rounded-xl p-5 shadow-civic-subtle">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-civic-muted uppercase tracking-wider">SLA Risk / Overdue</span>
            <div className="p-2 rounded-lg bg-red-50 text-red-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#10213F] mt-2 font-mono">{summary.overdue}</div>
          <span className="text-[10px] text-red-600 font-semibold block mt-1">Requires immediate priority</span>
        </div>
      </div>

      {/* Task Filters */}
      <div className="flex items-center gap-2 border-b border-civic-border pb-3">
        {['ALL', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterStatus === st
                ? 'bg-[#10213F] text-white shadow-xs'
                : 'bg-slate-100 text-civic-muted hover:bg-slate-200'
            }`}
          >
            {st === 'ALL' ? 'All Assigned' : st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="bg-white border border-civic-border rounded-xl p-12 text-center text-xs text-civic-muted space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-civic-action" />
          <span>Loading assigned tasks...</span>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white border border-civic-border rounded-xl p-12 text-center text-xs text-civic-muted space-y-2">
          <Wrench className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-[#10213F]">No Assigned Tasks</h3>
          <p>No complaints matching status "{filterStatus}" are currently assigned to you.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => {
            const taskIdStr = task._id || task.id;
            const slaDeadline = task.sla?.deadline ? new Date(task.sla.deadline).toLocaleString() : 'N/A';
            const isBreached = task.sla?.status === 'BREACHED';

            return (
              <div key={taskIdStr} className="bg-white border border-civic-border rounded-xl shadow-civic-subtle p-6 space-y-4 hover:border-slate-300 transition-colors">
                
                {/* Task Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-extrabold text-[#10213F]">
                      #{taskIdStr.slice(-6)}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                      task.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-800' :
                      task.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' :
                      task.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {task.status}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      task.priority === 'CRITICAL' || task.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                      task.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      Priority: {task.priority || 'MEDIUM'}
                    </span>
                  </div>

                  {/* SLA Badge */}
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className={`w-3.5 h-3.5 ${isBreached ? 'text-red-500' : 'text-slate-400'}`} />
                    <span className={`text-[11px] font-medium ${isBreached ? 'text-red-700 font-bold' : 'text-civic-muted'}`}>
                      SLA Target: <strong className="font-mono">{slaDeadline}</strong>
                    </span>
                  </div>
                </div>

                {/* Task Details Body */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <h3 className="text-sm font-bold text-[#10213F]">
                      {task.category || 'Civic Issue'} &bull; {task.issue || 'Maintenance Task'}
                    </h3>
                    <p className="text-xs text-civic-muted leading-relaxed">
                      {task.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs text-civic-muted pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {task.ward || 'District Area'}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Citizen: {task.citizen?.name || 'Local Resident'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Reported: {new Date(task.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Photo Preview if any */}
                  {task.imageUrl && (
                    <div className="md:col-span-1 rounded-lg border border-slate-200 overflow-hidden max-h-32 bg-slate-50">
                      <img src={task.imageUrl} alt="Complaint evidence" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Action CTA Row */}
                <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-4 gap-3">
                  <div className="text-[11px] text-civic-muted font-medium">
                    Department: <strong className="text-[#10213F]">{task.department?.name || 'Public Works Department'}</strong>
                  </div>

                  <div className="flex items-center gap-3">
                    {task.status === 'ASSIGNED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={PlayCircle}
                        onClick={() => handleStartWork(taskIdStr)}
                        className="text-xs font-bold bg-amber-600 hover:bg-amber-700 cursor-pointer"
                      >
                        START WORK
                      </Button>
                    )}

                    {task.status === 'IN_PROGRESS' && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={CheckCircle2}
                        onClick={() => openResolutionModal(task)}
                        className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                      >
                        SUBMIT RESOLUTION
                      </Button>
                    )}

                    {task.status === 'RESOLVED' && (
                      <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600" /> Resolution Submitted (Awaiting Verification)
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* RESOLUTION EVIDENCE SUBMISSION MODAL */}
      {resolutionModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-civic-border rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 text-left">
            
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#10213F]">
                  Submit Resolution Evidence
                </h3>
                <p className="text-xs text-civic-muted">
                  Complaint #{ (selectedTask._id || selectedTask.id).slice(-6) } &bull; {selectedTask.category}
                </p>
              </div>
              <button
                onClick={() => setResolutionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitResolution} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#10213F] mb-1">
                  Resolution Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Describe the completed repairs, materials used, or resolution details..."
                  className="w-full text-xs border border-civic-border rounded-lg p-3 text-[#10213F] focus:ring-1 focus:ring-civic-action focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#10213F] mb-1">
                  Evidence Photo URL (Optional)
                </label>
                <input
                  type="url"
                  value={resolutionImage}
                  onChange={(e) => setResolutionImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full text-xs border border-civic-border rounded-lg p-2.5 text-[#10213F] focus:ring-1 focus:ring-civic-action focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setResolutionModalOpen(false)}
                  disabled={submittingResolution}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingResolution}
                  icon={CheckCircle2}
                  className="font-bold bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                >
                  {submittingResolution ? 'Submitting...' : 'Confirm Resolution'}
                </Button>
              </div>
            </form>

          </div>
        </div>
      )}
    </Container>
  );
};

export default WorkerDashboard;
