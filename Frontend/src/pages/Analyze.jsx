import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCivic } from '../context/CivicContext';
import { analyzeIssue } from '../utils/aiIntelligence';
import Container from '../components/Container';
import Button from '../components/Button';
import SectionHeading from '../components/SectionHeading';
import PriorityBadge from '../components/PriorityBadge';
import { 
  Brain, ShieldCheck, CheckCircle2, MapPin, Building2, 
  Activity, AlertCircle, ArrowRight, ChevronLeft, Eye, RotateCcw, Clock
} from 'lucide-react';

const Analyze = () => {
  const { id } = useParams();
  const { issues, triggerAiAnalysis, applyAiAnalysis } = useCivic();
  const navigate = useNavigate();

  // Find issue by ID from Context/localStorage
  const issue = issues.find(i => (i.id === id || i._id === id));

  // Controlled processing steps
  const initialSteps = [
    { label: 'Reading report parameters', status: 'pending' },
    { label: 'Classifying hazard category', status: 'pending' },
    { label: 'Evaluating priority & severity', status: 'pending' },
    { label: 'Identifying location context', status: 'pending' },
    { label: 'Preparing department routing recommendation', status: 'pending' }
  ];

  const [processingSteps, setProcessingSteps] = useState(initialSteps);
  const [isProcessing, setIsProcessing] = useState(true);
  const [analysisResult, setAnalysisResult] = useState(null);

  useEffect(() => {
    if (!issue) return;

    if (issue.aiAnalysis) {
      setAnalysisResult(issue.aiAnalysis);
      setProcessingSteps(initialSteps.map((s) => ({ ...s, status: 'complete' })));
      setIsProcessing(false);
      return;
    }

    let isMounted = true;
    triggerAiAnalysis(issue.id || issue._id)
      .then((updated) => {
        if (!isMounted) return;
        if (updated && updated.aiAnalysis) {
          setAnalysisResult(updated.aiAnalysis);
        }
        setProcessingSteps((prev) => prev.map((step) => ({ ...step, status: 'complete' })));
        setIsProcessing(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('[AI Analysis API Warning]:', err.message);
        setProcessingSteps((prev) => prev.map((step) => ({ ...step, status: 'complete' })));
        setIsProcessing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, issue]);

  // Handle report not found
  if (!issue) {
    return (
      <Container className="max-w-md py-12 font-sans text-left">
        <div className="bg-white border border-civic-border rounded-xl p-8 text-center shadow-civic-normal space-y-5">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-50 text-red-600 border border-red-100 mb-2">
            <AlertCircle className="h-6.5 w-6.5" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-civic-navy font-sans">Report Not Found</h2>
          <p className="text-xs text-civic-muted leading-relaxed">
            We couldn't find a CivicAI report matching ID <strong className="font-mono text-civic-navy">{id}</strong>. The report may have been removed or the ID may be incorrect.
          </p>
          <div className="space-y-2 pt-2">
            <Link to="/track" className="block">
              <Button variant="primary" size="md" className="w-full font-bold">
                Back to Reports
              </Button>
            </Link>
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

  return (
    <Container className="max-w-4xl text-left py-4 font-sans space-y-8">
      
      {/* Back button */}
      <Link to="/report" className="inline-flex items-center gap-1 text-xs text-civic-muted hover:text-civic-navy font-semibold">
        <ChevronLeft className="w-3.5 h-3.5" /> Back to Reporting
      </Link>

      {/* Analysis Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 bg-blue-50 text-civic-action border border-blue-100 rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-wider mb-2 font-mono">
          <Brain className="w-3.5 h-3.5" /> CivicAI Intelligence Processing
        </div>
        <h1 className="text-2xl sm:text-3.5xl font-extrabold tracking-tight text-civic-navy leading-snug">
          Understanding Your Report
        </h1>
        <p className="text-xs sm:text-sm text-civic-muted mt-1.5 max-w-2xl leading-relaxed">
          CivicAI is analyzing the information you provided to identify the issue, determine its priority, and route it to the appropriate civic team.
        </p>
      </div>

      {/* Processing State Sequence (Visible while analyzing) */}
      {isProcessing ? (
        <div className="bg-white border border-civic-border rounded-xl p-6 md:p-8 shadow-civic-normal space-y-6">
          <div className="flex items-center gap-3 border-b border-civic-light-gray pb-4">
            <div className="w-4 h-4 border-2 border-civic-action border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-bold uppercase tracking-wider text-civic-navy">
              Processing Case #{issue.id}...
            </span>
          </div>

          <div className="space-y-3 font-sans" aria-live="polite">
            {processingSteps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs">
                <div className="w-5 flex justify-center">
                  {step.status === 'complete' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  {step.status === 'processing' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
                  )}
                  {step.status === 'pending' && (
                    <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                  )}
                </div>
                <span className={`font-semibold ${
                  step.status === 'complete' ? 'text-civic-navy' :
                  step.status === 'processing' ? 'text-civic-action font-bold' :
                  'text-slate-400 font-normal'
                }`}>
                  0{idx + 1} &bull; {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Analysis Results View */
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          {/* Main Results Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column: Result Card & Rationale */}
            <div className="space-y-6">
              
              {/* Result Card */}
              <div className="bg-white border border-civic-border rounded-xl p-6 shadow-civic-normal space-y-5">
                <div className="flex justify-between items-center border-b border-civic-light-gray pb-3">
                  <span className="text-[10px] font-bold text-civic-action uppercase tracking-wider flex items-center gap-1 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5" /> CivicAI Analysis Complete
                  </span>
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                    {analysisResult?.confidence} Confidence
                  </span>
                </div>

                <div className="space-y-4 text-xs font-sans text-civic-navy">
                  <div>
                    <span className="block text-[9px] font-bold text-civic-muted uppercase tracking-wide">Detected Issue</span>
                    <span className="text-lg font-bold text-civic-navy mt-0.5 block">{analysisResult?.detectedIssue}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[9px] font-bold text-civic-muted uppercase tracking-wide">Category</span>
                      <span className="font-bold">{analysisResult?.category}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-civic-muted uppercase tracking-wide">Evaluated Priority</span>
                      <div className="mt-1">
                        <PriorityBadge priority={analysisResult?.priority} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                    <div>
                      <span className="block text-[9px] font-bold text-civic-muted uppercase tracking-wide">Updated Status</span>
                      <span className="inline-flex items-center gap-1.5 mt-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span className="font-bold text-amber-800">Under Review</span>
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-civic-muted uppercase tracking-wide">Case Tracking ID</span>
                      <span className="font-mono font-bold text-civic-navy block mt-1">{issue.id}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Priority Rationale Box */}
              <div className="bg-slate-50 border border-civic-border rounded-xl p-5 space-y-2">
                <span className="text-[10px] font-bold text-civic-navy uppercase tracking-wider block">
                  Priority Assessment Rationale
                </span>
                <p className="text-xs text-civic-muted leading-relaxed">
                  {analysisResult?.reasoning}
                </p>
              </div>

            </div>

            {/* Right Column: Recommended Dept, Location Insights & Timeline */}
            <div className="space-y-6">
              
              {/* Recommended Department */}
              <div className="bg-white border border-civic-border rounded-xl p-5 shadow-civic-subtle space-y-3">
                <span className="text-[10px] font-bold text-civic-muted uppercase tracking-wider block flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-civic-action" /> Recommended Department
                </span>
                <div className="text-sm font-bold text-civic-navy bg-slate-50 border border-slate-200 px-3 py-2 rounded">
                  {analysisResult?.recommendedDepartment}
                </div>
                <p className="text-[11px] text-civic-muted leading-tight">
                  Automatically routed based on classified hazard category and location district parameters.
                </p>
              </div>

              {/* Location Intelligence */}
              <div className="bg-white border border-civic-border rounded-xl p-5 shadow-civic-subtle space-y-3">
                <span className="text-[10px] font-bold text-civic-muted uppercase tracking-wider block flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-civic-action" /> Location Intelligence
                </span>
                <div className="text-xs font-sans text-civic-navy space-y-1">
                  <div><strong>Address:</strong> {issue.location?.address || issue.title || 'Pinned Map Coordinates'}</div>
                  <div><strong>District/Ward:</strong> {issue.ward}</div>
                </div>
                <p className="text-[11px] text-civic-muted leading-tight border-t border-slate-100 pt-2">
                  {analysisResult?.locationInsight}
                </p>
              </div>

              {/* Lifecycle Progress Timeline */}
              <div className="bg-white border border-civic-border rounded-xl p-5 shadow-civic-subtle space-y-3">
                <span className="text-[10px] font-bold text-civic-muted uppercase tracking-wider block flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-civic-action" /> Issue Lifecycle Progress
                </span>
                
                <div className="grid grid-cols-5 gap-1 text-[9px] font-bold text-center">
                  <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 py-1.5 rounded">
                    Reported ✓
                  </div>
                  <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 py-1.5 rounded">
                    AI Analyzed ✓
                  </div>
                  <div className="bg-amber-50 text-amber-800 border border-amber-200 py-1.5 rounded font-extrabold">
                    Under Review
                  </div>
                  <div className="bg-slate-50 text-slate-400 border border-slate-100 py-1.5 rounded">
                    Assigned
                  </div>
                  <div className="bg-slate-50 text-slate-400 border border-slate-100 py-1.5 rounded">
                    Resolved
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Completion Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-civic-border">
            <Link to={`/track?id=${issue.id}`} className="flex-grow">
              <Button variant="primary" size="md" className="w-full font-bold" icon={ArrowRight}>
                TRACK THIS ISSUE
              </Button>
            </Link>
            <Link to="/map" className="flex-grow">
              <Button variant="secondary" size="md" className="w-full font-semibold" icon={MapPin}>
                VIEW LIVE MAP
              </Button>
            </Link>
            <Link to="/" className="flex-grow sm:flex-grow-0">
              <Button variant="ghost" size="md" className="w-full font-medium">
                Return Home
              </Button>
            </Link>
          </div>

        </motion.div>
      )}

    </Container>
  );
};

export default Analyze;
