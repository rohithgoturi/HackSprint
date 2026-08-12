import React from 'react';
import { Link } from 'react-router-dom';
import { Landmark, ExternalLink } from 'lucide-react';
import Container from './Container';

const Footer = () => {
  return (
    <footer className="bg-civic-navy text-slate-300 border-t border-slate-800 mt-auto py-10">
      <Container>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-left">
          {/* Brand Info */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 text-white mb-3">
              <Landmark className="w-5 h-5 text-civic-action" />
              <span className="text-base font-bold tracking-tight">CivicAI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Empowering communities with open, collaborative public infrastructure tracking. Developed in cooperation with municipal digital services.
            </p>
          </div>
          
          {/* Column 1 */}
          <div>
            <h4 className="text-xs font-semibold text-white tracking-wider uppercase mb-3">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/map" className="hover:text-white transition-colors">Explore Live Map</Link></li>
              <li><Link to="/report" className="hover:text-white transition-colors">Report an Issue</Link></li>
              <li><Link to="/track" className="hover:text-white transition-colors">Track Submissions</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition-colors">Citizen Dashboard</Link></li>
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h4 className="text-xs font-semibold text-white tracking-wider uppercase mb-3">Resources</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-white transition-colors flex items-center gap-1">Open Data Portal <ExternalLink className="w-3 h-3 text-slate-500" /></a></li>
              <li><a href="#" className="hover:text-white transition-colors">City Council Archives</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Developer API Docs</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Reporting Integrity</a></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h4 className="text-xs font-semibold text-white tracking-wider uppercase mb-3">Legal & Info</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Accessibility Standards</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Public Disclosures</a></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Banner */}
        <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row md:items-center md:justify-between text-[11px] text-slate-400 gap-4 text-left">
          <div className="max-w-2xl leading-relaxed">
            <span className="font-semibold text-amber-500 mr-1 font-sans">⚠️ PUBLIC SERVICE NOTICE:</span>
            CivicAI is a portal for reporting non-emergency public infrastructure maintenance. If you are experiencing a situation that poses an immediate threat to public safety, life, or property, please dial emergency services (911) immediately.
          </div>
          <div className="whitespace-nowrap font-mono">
            &copy; {new Date().getFullYear()} CivicAI. Public Domain.
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
