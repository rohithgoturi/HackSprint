import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useCivic } from '../context/CivicContext';
import { Menu, X, Landmark, User, LogOut, ShieldAlert } from 'lucide-react';
import Container from './Container';

const Navbar = () => {
  const { currentUser, logoutUser, authStatus, isAdmin } = useCivic();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/');
    setIsOpen(false);
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Live Map', path: '/map' },
    { name: 'Track Issue', path: '/track' },
    { name: 'Dashboard', path: '/dashboard' },
  ];

  const activeClass = "text-civic-action border-b-2 border-civic-action font-semibold";
  const inactiveClass = "text-civic-muted hover:text-civic-navy font-medium border-b-2 border-transparent hover:border-slate-300";

  return (
    <nav className="sticky top-0 bg-white border-b border-civic-border z-50">
      <Container>
        <div className="flex justify-between h-16">
          {/* Logo / Branding */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2.5 text-civic-navy">
              <Landmark className="w-5.5 h-5.5 text-civic-action" />
              <span className="text-lg font-extrabold tracking-tight text-civic-navy">
                Civic<span className="text-civic-action font-medium">AI</span>
              </span>
              <span className="hidden sm:inline-block bg-civic-light-gray text-civic-muted text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded border border-slate-200">
                Official Portal
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <NavLink 
                key={link.path}
                to={link.path}
                className={({ isActive }) => 
                  `h-full inline-flex items-center pt-1 px-1 transition-all ${isActive ? activeClass : inactiveClass}`
                }
              >
                {link.name}
              </NavLink>
            ))}
            
            {isAdmin && (
              <NavLink 
                to="/admin"
                className={({ isActive }) => 
                  `h-full inline-flex items-center pt-1 px-1 transition-all ${
                    isActive 
                      ? "text-red-700 border-b-2 border-red-600 font-semibold" 
                      : "text-red-600 hover:text-red-800 font-medium border-b-2 border-transparent hover:border-red-200"
                  }`
                }
              >
                <ShieldAlert className="w-4 h-4 mr-1.5" />
                Admin Portal
              </NavLink>
            )}
          </div>

          {/* Auth Button (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            {authStatus ? (
              <div className="flex items-center space-x-3">
                <Link 
                  to="/report"
                  className="bg-civic-action hover:bg-civic-action-hover text-white text-xs font-semibold px-4 py-2 rounded transition-colors shadow-sm cursor-pointer mr-1"
                >
                  Report an Issue
                </Link>
                <div className="flex items-center space-x-2 text-xs text-civic-navy font-semibold bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{currentUser.name}</span>
                  <span className="text-[9px] bg-slate-200 text-civic-muted px-1.5 py-0.25 rounded uppercase">
                    {currentUser.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-civic-navy hover:bg-slate-50 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login"
                  className="text-civic-navy hover:text-civic-action text-xs font-semibold px-3 py-2 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/report"
                  className="bg-civic-action hover:bg-civic-action-hover text-white text-xs font-semibold px-4 py-2 rounded transition-colors shadow-sm cursor-pointer"
                >
                  Report an Issue
                </Link>
              </div>
            )}
          </div>

          {/* Hamburger menu (Mobile) */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded text-slate-500 hover:text-civic-navy hover:bg-slate-50 focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-civic-border">
          <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded text-sm font-medium ${
                    isActive 
                      ? 'bg-blue-50 text-civic-action font-semibold' 
                      : 'text-civic-muted hover:bg-slate-50 hover:text-civic-navy'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
            
            {isAdmin && (
              <NavLink
                to="/admin"
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded text-sm font-medium ${
                    isActive 
                      ? 'bg-red-50 text-red-700 font-semibold' 
                      : 'text-red-600 hover:bg-red-50'
                  }`
                }
              >
                Admin Portal
              </NavLink>
            )}
            
            <div className="border-t border-slate-100 pt-4 pb-2 px-3">
              {authStatus ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-civic-navy font-semibold">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{currentUser.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center bg-slate-50 border border-slate-200 text-civic-navy text-xs font-semibold px-4 py-2.5 rounded shadow-sm hover:bg-slate-100"
                  >
                    Login
                  </Link>
                  <Link
                    to="/report"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center bg-civic-action hover:bg-civic-action-hover text-white text-xs font-semibold px-4 py-2.5 rounded shadow-sm"
                  >
                    Report an Issue
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
