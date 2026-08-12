// Frontend demo authentication only.
// Replace with secure server-side authentication in production.

import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useCivic } from '../context/CivicContext';
import { ShieldAlert, KeyRound, ArrowRight } from 'lucide-react';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, currentUser } = useCivic();
  const location = useLocation();

  // If unauthenticated, redirect to login page with return URL parameter
  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // If requiredRole is specified and current user doesn't match
  if (requiredRole && currentUser?.role !== requiredRole) {
    if (requiredRole === 'admin') {
      return (
        <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center p-4 font-sans text-left">
          <div className="bg-white border border-civic-border rounded-xl p-8 max-w-md w-full shadow-civic-normal text-center space-y-5">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold tracking-tight text-[#10213F]">
                ADMIN ACCESS REQUIRED
              </h2>
              <p className="text-xs text-civic-muted leading-relaxed">
                This area is available to municipal operations staff.
              </p>
            </div>
            
            <div className="pt-2 space-y-3">
              <Link 
                to={`/login?redirect=${encodeURIComponent(location.pathname)}`} 
                className="block w-full bg-civic-action hover:bg-civic-action-hover text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                GO TO LOGIN
              </Link>
              <Link 
                to="/" 
                className="block text-xs font-semibold text-civic-muted hover:text-civic-navy transition-colors"
              >
                Return to Public Portal
              </Link>
            </div>

            <div className="border-t border-slate-100 pt-4 text-[11px] text-slate-400 font-mono">
              // Frontend demo authentication only.
            </div>
          </div>
        </div>
      );
    }

    // Default unauthorized fallback
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
