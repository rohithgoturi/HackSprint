import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { useCivic } from '../context/CivicContext';
import Container from '../components/Container';
import Button from '../components/Button';
import SectionHeading from '../components/SectionHeading';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { 
  MapPin, FileText, CheckCircle2, ClipboardList, Brain, 
  ShieldCheck, ArrowRight, Eye, AlertTriangle, AlertCircle, 
  Map as MapIcon, ChevronRight, Activity
} from 'lucide-react';

// Import images from assets
import heroStreet from '../assets/hero_street.png';
import communityStreet from '../assets/community_street.png';

// Leaflet marker icon color helper
const createCustomIcon = (status) => {
  let color = '#1769E0'; // Submitted (Civic Blue)
  if (status === 'In Progress') color = '#D97706'; // Amber
  if (status === 'Resolved') color = '#059669'; // Emerald

  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="28" height="28">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;
  
  return L.divIcon({
    html: svgIcon,
    className: 'custom-leaflet-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  });
};

// Map Recenter Helper component
const MapRecenter = ({ location }) => {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.setView([location.lat, location.lng], 14, { animate: true, duration: 0.8 });
    }
  }, [location, map]);
  return null;
};

const Home = () => {
  const { issues } = useCivic();
  
  // Hero Interactive Markers State
  const [activePin, setActivePin] = useState(null);
  
  // Workflow Interactive State
  const [activeStep, setActiveStep] = useState(0);
  
  // Map Preview Sync State
  const [mapCenterIssue, setMapCenterIssue] = useState(null);

  // Default coordinate center
  const sfCenter = [37.7749, -122.4194];

  // Hero markers details
  const heroPins = [
    {
      id: 'pin-1',
      title: 'Broken Streetlight',
      priority: 'Medium',
      location: 'Ward 13',
      color: 'bg-amber-500',
      pos: 'top-[22%] left-[64%]'
    },
    {
      id: 'pin-2',
      title: 'Pothole',
      priority: 'High',
      location: 'Ward 12',
      color: 'bg-red-500',
      pos: 'top-[42%] left-[22%]'
    },
    {
      id: 'pin-3',
      title: 'Garbage Overflow',
      priority: 'Medium',
      location: 'Ward 11',
      color: 'bg-amber-500',
      pos: 'top-[54%] left-[78%]'
    },
    {
      id: 'pin-4',
      title: 'Water Leakage',
      priority: 'High',
      location: 'Ward 12',
      color: 'bg-blue-500',
      pos: 'top-[70%] left-[44%]'
    }
  ];

  // Workflow steps
  const steps = [
    {
      num: '01',
      title: 'Report',
      tagline: 'Describe the problem and share its location.',
      icon: MapPin,
      heading: 'Capture the problem',
      desc: 'Residents can easily take a photo of local damage, input a brief description, categorize the issue, and pin the precise location on our map system.',
      visualMock: (
        <div className="bg-slate-50 border border-civic-border rounded-lg p-5 text-left text-xs text-civic-navy space-y-3 font-sans shadow-sm">
          <span className="font-bold text-civic-action block uppercase tracking-wider text-[10px]">Resident Form Preview</span>
          <div className="space-y-2">
            <div>
              <span className="block text-[10px] font-bold text-civic-muted uppercase">Issue Category</span>
              <div className="border border-civic-border rounded p-2 bg-white font-medium mt-1">Pothole / Road Damage</div>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-civic-muted uppercase">Description</span>
              <div className="border border-civic-border rounded p-2 bg-white text-civic-muted mt-1 leading-relaxed">
                Deep pothole in the left lane blocking pedestrian traffic near school crosswalk...
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <span className="block text-[10px] font-bold text-civic-muted uppercase">District Ward</span>
                <div className="border border-civic-border rounded p-2 bg-white font-medium mt-1">Ward 12</div>
              </div>
              <div className="flex-1">
                <span className="block text-[10px] font-bold text-civic-muted uppercase">Attachments</span>
                <div className="border border-civic-border rounded p-2 bg-white text-emerald-600 font-bold mt-1 text-center">image_attached.jpg</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      num: '02',
      title: 'Understand',
      tagline: 'CivicAI identifies the issue and evaluates its priority.',
      icon: Brain,
      heading: 'CivicAI analyzes the report',
      desc: 'The platform instantly categorizes unstructured descriptions, checks for duplicates, and assigns a preliminary priority based on hazard severity and surrounding coordinates.',
      visualMock: (
        <div className="bg-slate-50 border border-civic-border rounded-lg p-5 text-left text-xs text-civic-navy space-y-3 font-sans shadow-sm">
          <div className="flex justify-between items-center border-b border-civic-border pb-2">
            <span className="font-bold text-civic-action block uppercase tracking-wider text-[10px] flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> Intelligence Processing
            </span>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[9px] font-semibold px-2 py-0.5 rounded-full font-mono">
              96% Confidence
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-[11px] leading-relaxed">
            <div>
              <span className="block text-[9px] font-bold text-civic-muted uppercase">Classified Hazard</span>
              <span className="font-bold text-civic-navy">Pothole / Road Damage</span>
            </div>
            <div>
              <span className="block text-[9px] font-bold text-civic-muted uppercase">Priority Evaluated</span>
              <span className="font-bold text-red-600">High Severity</span>
            </div>
            <div>
              <span className="block text-[9px] font-bold text-civic-muted uppercase">Duplicate Checks</span>
              <span className="font-bold text-emerald-700">0 Matching Found</span>
            </div>
            <div>
              <span className="block text-[9px] font-bold text-civic-muted uppercase">Suggested Target</span>
              <span className="font-bold text-civic-navy">Roads & Streets Dept.</span>
            </div>
          </div>
        </div>
      )
    },
    {
      num: '03',
      title: 'Track',
      tagline: 'Follow the progress of your complaint.',
      icon: ClipboardList,
      heading: 'Know what is happening',
      desc: 'Check the real-time resolution logs at any time. Receive automatic alerts when dispatchers review, assign, or complete repair operations for your submission.',
      visualMock: (
        <div className="bg-slate-50 border border-civic-border rounded-lg p-5 text-left text-xs text-civic-navy space-y-3 font-sans shadow-sm">
          <span className="font-bold text-civic-action block uppercase tracking-wider text-[10px]">Resolution Timeline</span>
          <div className="relative pl-6 space-y-3 text-[11px] leading-tight">
            <div className="absolute left-[3px] top-1 bottom-1 w-0.5 bg-slate-200"></div>
            
            <div className="relative">
              <span className="absolute -left-6 top-0 w-2 h-2 rounded-full bg-slate-400"></span>
              <div className="text-slate-400 font-semibold">Submitted &bull; 10:15 AM</div>
              <div className="text-slate-400 text-[10px]">Logged in district registry</div>
            </div>
            <div className="relative">
              <span className="absolute -left-6 top-0 w-2 h-2 rounded-full bg-slate-400"></span>
              <div className="text-slate-400 font-semibold">Under Review &bull; 11:20 AM</div>
              <div className="text-slate-400 text-[10px]">Priority verified by supervisor</div>
            </div>
            <div className="relative">
              <span className="absolute -left-6 top-0 w-2.5 h-2.5 rounded-full bg-blue-600 border border-white"></span>
              <div className="text-civic-navy font-bold">Assigned to Crew &bull; 02:40 PM</div>
              <div className="text-civic-muted text-[10px]">Dispatched to Streets Division 4</div>
            </div>
          </div>
        </div>
      )
    },
    {
      num: '04',
      title: 'Resolve',
      tagline: 'See when the issue is addressed.',
      icon: ShieldCheck,
      heading: 'See the outcome',
      desc: 'Once repairs are finished, maintenance crews post verification photos. The issue status shifts to "Resolved" on the public dashboard and live map coordinates.',
      visualMock: (
        <div className="bg-slate-50 border border-civic-border rounded-lg p-5 text-left text-xs text-civic-navy space-y-3 font-sans shadow-sm">
          <span className="font-bold text-civic-action block uppercase tracking-wider text-[10px]">Verification Report</span>
          <div className="flex gap-2">
            <div className="flex-1 bg-white border border-civic-border rounded p-2 text-center">
              <span className="block text-[8px] font-bold text-civic-muted uppercase">Before</span>
              <span className="text-[10px] font-semibold text-red-600 block mt-1">Hazard Active</span>
            </div>
            <div className="flex-1 bg-white border border-civic-border rounded p-2 text-center">
              <span className="block text-[8px] font-bold text-civic-muted uppercase">After</span>
              <span className="text-[10px] font-semibold text-emerald-600 block mt-1">Repaired &bull; Closed</span>
            </div>
          </div>
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded p-2 text-center font-semibold text-[10px] leading-tight">
            Fix verified by inspector at 04:30 PM
          </div>
        </div>
      )
    }
  ];

  // Filter 3 map preview issues to display in sidebar list
  const nearbyIssues = issues.slice(0, 3);

  return (
    <div className="space-y-16">
      
      {/* 2. HERO SECTION */}
      <section className="py-6 border-b border-civic-border text-left">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            
            {/* Left Side Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-1.5 bg-blue-50 text-civic-action border border-blue-100 rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-wider">
                Smarter Cities. Better Communities.
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-civic-navy leading-[1.1] font-sans">
                Make Your City Better, One Report at a Time.
              </h1>
              <p className="text-base sm:text-lg text-civic-muted leading-relaxed max-w-lg">
                CivicAI helps citizens report local problems, understand their impact, and track them until they are resolved.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/report">
                  <Button variant="primary" size="lg" icon={FileText}>
                    Report an Issue
                  </Button>
                </Link>
                <Link to="/map">
                  <Button variant="secondary" size="lg" icon={MapIcon}>
                    Explore Live Map
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Side City Map Overlays */}
            <div className="relative rounded-xl overflow-hidden border border-civic-border shadow-civic-normal aspect-[4/3] w-full bg-slate-100 group select-none">
              
              {/* Background City Image */}
              <img 
                src={heroStreet} 
                alt="Real city street infrastructure" 
                className="absolute inset-0 w-full h-full object-cover object-center"
              />

              {/* Stats overlay box (4 Issues Nearby) */}
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-xs border border-civic-border rounded-lg p-3.5 shadow-md z-10 w-44 text-left font-sans">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5">
                  <span className="text-[11px] font-bold text-civic-navy uppercase tracking-wider">Nearby Issues</span>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                </div>
                <div className="text-2xl font-extrabold text-civic-navy">4</div>
                <div className="text-[10px] text-civic-muted mt-1 space-y-0.5">
                  <div className="flex justify-between">
                    <span>High Priority</span>
                    <span className="font-semibold text-red-600">2</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medium Priority</span>
                    <span className="font-semibold text-amber-600">2</span>
                  </div>
                </div>
              </div>

              {/* Pin Overlays */}
              {heroPins.map((pin) => (
                <div 
                  key={pin.id} 
                  className={`absolute ${pin.pos} z-10`}
                  onMouseEnter={() => setActivePin(pin.id)}
                  onMouseLeave={() => setActivePin(null)}
                >
                  {/* Pin Dot */}
                  <div className="relative cursor-pointer group flex items-center justify-center">
                    <span className={`absolute inline-flex h-6 w-6 rounded-full ${pin.color} opacity-40 animate-ping`}></span>
                    <div className={`w-3.5 h-3.5 rounded-full ${pin.color} border-2 border-white shadow-md relative z-10`}></div>
                  </div>

                  {/* Pin Label Hover Box */}
                  <AnimatePresence>
                    {(activePin === pin.id || activePin === null && pin.id === 'pin-2') && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-civic-navy text-white text-[10px] rounded p-2 shadow-lg w-32 border border-slate-800 text-left font-sans pointer-events-none"
                      >
                        <div className="font-bold border-b border-slate-800 pb-1 mb-1 truncate">{pin.title}</div>
                        <div className="flex justify-between text-[9px] text-slate-300">
                          <span>{pin.priority}</span>
                          <span className="font-bold">{pin.location}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

            </div>

          </div>
        </Container>
      </section>

      {/* 3. STATISTICS STRIP */}
      <section className="py-6 border-b border-civic-border bg-slate-50/50">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-civic-navy tracking-tight font-sans">12,480+</div>
              <div className="text-xs font-semibold text-civic-muted uppercase tracking-wider">Issues Reported</div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-civic-navy tracking-tight font-sans">8,920+</div>
              <div className="text-xs font-semibold text-civic-muted uppercase tracking-wider">Resolved</div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-civic-navy tracking-tight font-sans">32</div>
              <div className="text-xs font-semibold text-civic-muted uppercase tracking-wider">Areas Covered</div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-civic-navy tracking-tight font-sans">94%</div>
              <div className="text-xs font-semibold text-civic-muted uppercase tracking-wider">Citizen Satisfaction</div>
            </div>

          </div>
        </Container>
      </section>

      {/* 4. WORKFLOW SECTION */}
      <section className="py-6 text-left">
        <Container className="space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3.5xl font-extrabold tracking-tight text-civic-navy uppercase font-sans">
              From Report to Resolution
            </h2>
            <p className="text-sm sm:text-base text-civic-muted">
              Simple for citizens. Actionable for authorities.
            </p>
          </div>

          {/* Workflow Interactive tabs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {steps.map((step, idx) => {
              const IconComp = step.icon;
              const isActive = activeStep === idx;
              return (
                <button
                  key={step.num}
                  onClick={() => setActiveStep(idx)}
                  className={`w-full text-left p-5 border rounded-lg transition-all flex flex-col justify-between h-44 shadow-civic-subtle cursor-pointer ${
                    isActive 
                      ? 'border-civic-action bg-blue-50/20 ring-1 ring-civic-action' 
                      : 'border-civic-border bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className={`text-xl font-bold font-mono ${isActive ? 'text-civic-action' : 'text-slate-300'}`}>
                      {step.num}
                    </span>
                    <IconComp className={`w-5 h-5 ${isActive ? 'text-civic-action' : 'text-slate-400'}`} />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-civic-navy">{step.title}</h3>
                    <p className="text-xs text-civic-muted leading-snug line-clamp-2">{step.tagline}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Step Detail display panel */}
          <div className="bg-white border border-civic-border rounded-xl p-6 md:p-8 shadow-civic-normal grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[220px]">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-block bg-blue-50 border border-blue-100 text-civic-action text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                Step Details &bull; {steps[activeStep].num}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-civic-navy font-sans">
                {steps[activeStep].heading}
              </h3>
              <p className="text-xs sm:text-sm text-civic-muted leading-relaxed max-w-xl">
                {steps[activeStep].desc}
              </p>
            </div>
            
            <div className="lg:col-span-5 w-full">
              {steps[activeStep].visualMock}
            </div>
          </div>

        </Container>
      </section>

      {/* 5. CIVICAI INTELLIGENCE SECTION */}
      <section className="py-6 text-left border-y border-civic-border bg-slate-50/30">
        <Container className="space-y-10">
          
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3.5xl font-extrabold tracking-tight text-civic-navy font-sans leading-tight">
              Technology that understands civic problems.
            </h2>
            <p className="text-xs sm:text-sm text-civic-muted mt-2">
              CivicAI turns unstructured citizen reports into clear, actionable information.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            
            {/* Simulated Analysis Card (Left Column) */}
            <div className="bg-white border border-civic-border rounded-xl p-6 shadow-civic-normal space-y-5 font-sans">
              
              {/* Card Header details */}
              <div className="flex justify-between items-start gap-2 border-b border-civic-light-gray pb-4">
                <div>
                  <span className="text-[10px] font-bold text-civic-action uppercase tracking-wide">Analysis Interface</span>
                  <h3 className="text-base font-extrabold text-civic-navy mt-0.5">Report Case #CIV-1006</h3>
                </div>
                <div className="bg-red-50 text-red-800 border border-red-100 text-[10px] font-bold px-2 py-0.5 rounded">
                  High Priority
                </div>
              </div>

              {/* Parameter Table details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="block text-[10px] font-bold text-civic-muted uppercase">Issue Classification</span>
                  <span className="font-bold text-civic-navy mt-0.5 block">Road Damage</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-civic-muted uppercase">Category</span>
                  <span className="font-bold text-civic-navy mt-0.5 block">Infrastructure</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-civic-muted uppercase">Confidence Index</span>
                  <span className="font-bold text-emerald-700 mt-0.5 block">94% Accurate</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-civic-muted uppercase">Location Assigned</span>
                  <span className="font-bold text-civic-navy mt-0.5 block">Ward 12 / District 6</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-[10px] font-bold text-civic-muted uppercase mb-1">Recommended Dispatch</span>
                  <span className="font-semibold text-civic-navy border border-slate-200 bg-slate-50 px-2 py-1 rounded block">
                    Municipal Roads Department
                  </span>
                </div>
              </div>

              {/* Progress Timeline */}
              <div className="border-t border-civic-light-gray pt-4 space-y-2">
                <span className="block text-[10px] font-bold text-civic-muted uppercase">Case Status Pipeline</span>
                
                <div className="flex items-center justify-between text-[10px] font-bold text-civic-navy">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px]">&bull;</div>
                    <span className="text-slate-400 font-normal">Reported</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-slate-200 mx-2"></div>
                  
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-sm flex items-center justify-center text-white text-[10px]">
                      2
                    </div>
                    <span className="text-civic-action font-extrabold">Under Review</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-slate-100 mx-2"></div>
                  
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-[8px]">&bull;</div>
                    <span className="text-slate-300 font-normal">Assigned</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-slate-100 mx-2"></div>
                  
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-[8px]">&bull;</div>
                    <span className="text-slate-300 font-normal">In Progress</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-slate-100 mx-2"></div>

                  <div className="flex flex-col items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-[8px]">&bull;</div>
                    <span className="text-slate-300 font-normal">Resolved</span>
                  </div>
                </div>

              </div>

            </div>

            {/* Analysis Capabilities List (Right Column) */}
            <div className="space-y-6">
              
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-blue-50 border border-blue-100 rounded text-civic-action">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-civic-navy uppercase tracking-wide">01 &bull; Issue Classification</h4>
                  <p className="text-xs text-civic-muted mt-1 leading-relaxed">
                    Automatically categorize civic complaints into structured maintenance departments directly from user photographs and descriptions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-blue-50 border border-blue-100 rounded text-civic-action">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-civic-navy uppercase tracking-wide">02 &bull; Priority Detection</h4>
                  <p className="text-xs text-civic-muted mt-1 leading-relaxed">
                    Identify high-severity safety hazards and critical failures that need immediate response crew dispatch and emergency routing.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-blue-50 border border-blue-100 rounded text-civic-action">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-civic-navy uppercase tracking-wide">03 &bull; Location Intelligence</h4>
                  <p className="text-xs text-civic-muted mt-1 leading-relaxed">
                    Understand where civic problems are clustered across districts, enabling city councils to plan long-term capital improvement projects.
                  </p>
                </div>
              </div>

            </div>

          </div>

        </Container>
      </section>

      {/* 6. LIVE MAP PREVIEW */}
      <section className="py-6 text-left">
        <Container className="space-y-10">
          
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3.5xl font-extrabold tracking-tight text-civic-navy font-sans">
              See What Needs Attention Around You
            </h2>
            <p className="text-xs sm:text-sm text-civic-muted">
              Explore reported civic issues and understand what is happening across the city.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 border border-civic-border rounded-xl overflow-hidden bg-white shadow-civic-subtle h-[420px] lg:h-[480px]">
            
            {/* Sidebar list panel */}
            <div className="lg:col-span-1 border-r border-civic-border flex flex-col h-full bg-slate-50">
              <div className="p-4 border-b border-civic-border bg-white flex-none">
                <span className="text-[10px] font-bold uppercase tracking-wider text-civic-navy block">
                  Nearby Issues Logs
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
                {nearbyIssues.map((issue) => (
                  <button
                    key={issue.id}
                    onClick={() => setMapCenterIssue(issue)}
                    className={`w-full text-left p-3 rounded transition-all flex flex-col gap-1 border border-transparent cursor-pointer ${
                      mapCenterIssue?.id === issue.id 
                        ? 'bg-white border-civic-border shadow-xs' 
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-civic-muted font-mono bg-slate-200 px-1 py-0.25 rounded">{issue.id}</span>
                      <span className="text-[9px] font-bold text-civic-action uppercase tracking-wide">{issue.category}</span>
                    </div>
                    <h4 className="text-xs font-bold text-civic-navy line-clamp-1">{issue.title}</h4>
                    <div className="flex items-center justify-between text-[9px] text-civic-muted mt-1">
                      <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" /> {issue.ward}</span>
                      <span className={`px-1.5 py-0.25 rounded-full font-semibold border ${
                        issue.status === 'Submitted' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        issue.status === 'In Progress' ? 'bg-amber-50 text-amber-800 border-amber-100' :
                        'bg-emerald-50 text-emerald-800 border-emerald-100'
                      }`}>{issue.status}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-3.5 border-t border-civic-border bg-white flex-none">
                <Link to="/map" className="block w-full">
                  <Button variant="primary" size="sm" className="w-full text-xs font-bold font-sans" icon={ArrowRight}>
                    Open Live Map
                  </Button>
                </Link>
              </div>
            </div>

            {/* Map panel */}
            <div className="lg:col-span-3 h-full relative z-10">
              <MapContainer 
                center={sfCenter} 
                zoom={13} 
                className="w-full h-full"
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                
                {issues.map(issue => (
                  <Marker 
                    key={issue.id}
                    position={[issue.location.lat, issue.location.lng]}
                    icon={createCustomIcon(issue.status)}
                    eventHandlers={{
                      click: () => {
                        setMapCenterIssue(issue);
                      }
                    }}
                  >
                    <Popup>
                      <div className="text-left font-sans p-1 max-w-[180px] space-y-1">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-1.5 mb-1">
                          <span className="font-mono text-[9px] font-bold text-civic-muted bg-slate-100 px-1 py-0.25 rounded">{issue.id}</span>
                          <PriorityBadge priority={issue.priority} />
                        </div>
                        <h4 className="font-bold text-xs text-civic-navy leading-snug">{issue.title}</h4>
                        <p className="text-[10px] text-civic-muted leading-relaxed line-clamp-2">{issue.description}</p>
                        <div className="flex items-center justify-between border-t border-slate-100 pt-1 text-[9px] text-civic-muted">
                          <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" /> {issue.ward}</span>
                          <span className="font-bold">{issue.status}</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {mapCenterIssue && (
                  <MapRecenter location={mapCenterIssue.location} />
                )}
              </MapContainer>
            </div>

          </div>

        </Container>
      </section>

      {/* 7. COMMUNITY IMPACT */}
      <section className="py-6 text-left border-t border-civic-border">
        <Container className="space-y-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3.5xl font-extrabold tracking-tight text-civic-navy font-sans uppercase leading-none">
                Your Report Doesn't End With a Complaint.
              </h2>
              <p className="text-sm text-civic-muted leading-relaxed">
                Every report creates visibility. Every resolved issue helps build a better, safer, and cleaner neighborhood for our families.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                
                <div className="border border-civic-border rounded-lg p-4 shadow-civic-subtle">
                  <span className="text-xl block mb-2">🧹</span>
                  <h4 className="text-xs font-bold text-civic-navy uppercase tracking-wider mb-1">Cleaner Streets</h4>
                  <p className="text-[10px] text-civic-muted leading-relaxed">Promoting trash-free sidewalks and clean public reserves.</p>
                </div>

                <div className="border border-civic-border rounded-lg p-4 shadow-civic-subtle">
                  <span className="text-xl block mb-2">💡</span>
                  <h4 className="text-xs font-bold text-civic-navy uppercase tracking-wider mb-1">Safer Wards</h4>
                  <p className="text-[10px] text-civic-muted leading-relaxed">Providing brightly lit blocks to secure evening commutes.</p>
                </div>

                <div className="border border-civic-border rounded-lg p-4 shadow-civic-subtle">
                  <span className="text-xl block mb-2">🛣️</span>
                  <h4 className="text-xs font-bold text-civic-navy uppercase tracking-wider mb-1">Better Infrastructure</h4>
                  <p className="text-[10px] text-civic-muted leading-relaxed">Repairing pavement fractures and damaged utilities fast.</p>
                </div>

              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-civic-border shadow-civic-normal aspect-[16/10] w-full">
              <img 
                src={communityStreet} 
                alt="Safe neighborhood pedestrian street" 
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>

        </Container>
      </section>

      {/* 8. FINAL CTA */}
      <section className="py-14 bg-slate-50 border-t border-civic-border text-center">
        <Container className="space-y-6 max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight text-civic-navy font-sans">
            See a Problem? Report It.
          </h2>
          <p className="text-sm text-civic-muted max-w-lg mx-auto leading-relaxed">
            Help make your neighborhood safer, cleaner and better maintained. Logging an issue takes less than two minutes.
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/report">
              <Button variant="primary" size="lg" icon={FileText}>
                Report an Issue
              </Button>
            </Link>
            <Link to="/track">
              <Button variant="secondary" size="lg" icon={Eye}>
                View Live Issues
              </Button>
            </Link>
          </div>
        </Container>
      </section>

    </div>
  );
};

export default Home;
