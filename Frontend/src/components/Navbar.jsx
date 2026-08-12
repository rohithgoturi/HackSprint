import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useCivic } from '../context/CivicContext';
import { Menu, X, Landmark, User, LogOut, ShieldAlert, FileText, Bell } from 'lucide-react';
import { notificationAPI } from '../services/api';
import Container from './Container';

const Navbar = () => {
  const { currentUser, logoutUser, isAuthenticated, isAdmin, isCitizen, isWorker, notificationsList, fetchNotifications } = useCivic();
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  const unreadCount = (notificationsList || []).filter(n => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      fetchNotifications();
    } catch (err) {
      console.warn('Mark all read error:', err.message);
    }
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/');
    setIsOpen(false);
  };

  // Compute navigation links based on role
  let navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Live Map', path: '/map' },
    { name: 'Track Issue', path: '/track' },
  ];

  if (isAuthenticated && isCitizen) {
    navLinks = [
      { name: 'Home', path: '/' },
      { name: 'Live Map', path: '/map' },
      { name: 'Track Issue', path: '/track' },
      { name: 'My Reports', path: '/reports' },
    ];
  } else if (isAuthenticated && isWorker) {
    navLinks = [
      { name: 'Worker Dashboard', path: '/worker' },
      { name: 'Live Map', path: '/map' },
      { name: 'Track Issue', path: '/track' },
    ];
  } else if (isAuthenticated && isAdmin) {
    navLinks = [
      { name: 'Operations Overview', path: '/admin' },
      { name: 'Issues List', path: '/admin/issues' },
      { name: 'Live Map', path: '/admin/map' },
      { name: 'Analytics', path: '/admin/analytics' },
    ];
  }

  const activeClass = "text-civic-action border-b-2 border-civic-action font-semibold";
  const inactiveClass = "text-civic-muted hover:text-civic-navy font-medium border-b-2 border-transparent hover:border-slate-300";

  return (
    <nav className="sticky top-0 bg-white border-b border-civic-border z-50">
      <Container>
        <div className="flex justify-between h-16">
          {/* Logo / Branding */}
          <div className="flex items-center">
            <Link to={isAdmin ? "/admin" : "/"} className="flex items-center gap-2.5 text-civic-navy">
              <Landmark className="w-5.5 h-5.5 text-civic-action" />
              <span className="text-lg font-extrabold tracking-tight text-civic-navy">
                Civic<span className="text-civic-action font-medium">AI</span>
              </span>
              <span className="hidden sm:inline-block bg-civic-light-gray text-civic-muted text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded border border-slate-200">
                {isAdmin ? "Operations Portal" : "Official Portal"}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <NavLink 
                key={link.path}
                to={link.path}
                end={link.path === '/' || link.path === '/admin'}
                className={({ isActive }) => 
                  `h-full inline-flex items-center pt-1 px-1 text-xs transition-all ${isActive ? activeClass : inactiveClass}`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </div>

          {/* Auth Controls (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {!isAdmin && (
                  <Link 
                    to="/report"
                    className="bg-civic-action hover:bg-civic-action-hover text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs cursor-pointer mr-1"
                  >
                    Report an Issue
                  </Link>
                )}

                <div className="flex items-center space-x-2 text-xs text-civic-navy font-semibold bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                  {isAdmin ? (
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>{currentUser?.name || (isAdmin ? 'Municipal Admin' : 'Demo Citizen')}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.25 rounded uppercase ${
                    isAdmin ? 'bg-slate-900 text-white' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {currentUser?.role || 'user'}
                  </span>
                </div>

                {/* Notifications Bell Icon */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      if (!showNotifications && unreadCount > 0) handleMarkAllRead();
                    }}
                    className="p-2 rounded-lg text-slate-500 hover:text-civic-navy hover:bg-slate-100 transition-colors relative cursor-pointer"
                    title="Notifications"
                  >
                    <Bell className="w-4.5 h-4.5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-civic-border rounded-xl shadow-xl z-50 text-left overflow-hidden">
                      <div className="p-3 bg-slate-50 border-b border-civic-border flex justify-between items-center">
                        <span className="text-xs font-extrabold text-[#10213F] uppercase tracking-wider">
                          Notifications ({notificationsList.length})
                        </span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[10px] text-civic-action hover:underline font-bold"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                        {notificationsList.length === 0 ? (
                          <div className="p-4 text-center text-xs text-civic-muted">
                            No notifications yet.
                          </div>
                        ) : (
                          notificationsList.map((n) => (
                            <div key={n._id || n.id} className={`p-3 text-xs space-y-1 ${n.isRead ? 'bg-white' : 'bg-blue-50/40'}`}>
                              <div className="font-bold text-[#10213F] flex items-center justify-between">
                                <span>{n.title}</span>
                                <span className="text-[9px] text-slate-400 font-normal">
                                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-civic-muted text-[11px] leading-relaxed">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-civic-navy hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  to="/login"
                  className="text-civic-navy hover:text-civic-action text-xs font-semibold px-3 py-2 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/report"
                  className="bg-civic-action hover:bg-civic-action-hover text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs cursor-pointer"
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
          <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3 text-left">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === '/' || link.path === '/admin'}
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
            
            <div className="border-t border-slate-100 pt-4 pb-2 px-3">
              {isAuthenticated ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-civic-navy font-semibold">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{currentUser?.name}</span>
                      <span className="text-[9px] bg-slate-200 text-civic-muted px-1.5 py-0.25 rounded uppercase">
                        {currentUser?.role}
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>

                  {!isAdmin && (
                    <Link
                      to="/report"
                      onClick={() => setIsOpen(false)}
                      className="block w-full text-center bg-civic-action text-white text-xs font-bold py-2.5 rounded shadow-xs"
                    >
                      Report an Issue
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center bg-slate-50 border border-slate-200 text-civic-navy text-xs font-semibold px-4 py-2.5 rounded shadow-xs hover:bg-slate-100"
                  >
                    Login
                  </Link>
                  <Link
                    to="/report"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center bg-civic-action hover:bg-civic-action-hover text-white text-xs font-semibold px-4 py-2.5 rounded shadow-xs"
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
