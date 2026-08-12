// Frontend demo role only — replace with real authentication in production.
import React, { useState } from 'react';
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { useCivic } from '../context/CivicContext';
import { 
  LayoutDashboard, 
  ListFilter, 
  MapPin, 
  BarChart3, 
  Settings, 
  LogOut, 
  Bell, 
  Search, 
  ShieldAlert, 
  Menu, 
  X, 
  Building2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const AdminLayout = () => {
  const { currentUser, logoutUser, isAdmin, issues, filters, setFilters } = useCivic();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const location = useLocation();
  const navigate = useNavigate();

  // Frontend demo role check
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-left">
        <div className="bg-white border border-civic-border rounded-xl p-8 max-w-md w-full shadow-civic-normal text-center space-y-5">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold tracking-tight text-civic-navy">
              ADMIN ACCESS REQUIRED
            </h2>
            <p className="text-xs text-civic-muted leading-relaxed">
              This operational dashboard is reserved for authorized municipal staff, ward supervisors, and public works dispatchers.
            </p>
          </div>
          
          <div className="pt-2 space-y-3">
            <Link 
              to="/login" 
              className="block w-full bg-civic-action hover:bg-civic-action-hover text-white text-xs font-bold py-2.5 px-4 rounded transition-colors shadow-sm cursor-pointer"
            >
              Go to Login
            </Link>
            <Link 
              to="/" 
              className="block text-xs font-semibold text-civic-muted hover:text-civic-navy transition-colors"
            >
              Return to Public Portal
            </Link>
          </div>

          <div className="border-t border-slate-100 pt-4 text-[11px] text-slate-400 font-mono">
            // Frontend demo role only — replace with real authentication in production.
          </div>
        </div>
      </div>
    );
  }

  // Derive notifications from actual local issue state
  const highPriorityOpen = issues.filter(i => i.priority === 'High' && i.status !== 'Resolved');
  const awaitingAssignment = issues.filter(i => i.status === 'Under Review' || i.status === 'Reported' || !i.assignedDepartment);
  const recentResolved = issues.filter(i => i.status === 'Resolved').slice(0, 2);

  const notifications = [
    ...(highPriorityOpen.length > 0 ? [{
      id: 'n1',
      title: `${highPriorityOpen.length} High-Priority Report${highPriorityOpen.length > 1 ? 's' : ''}`,
      desc: 'Requires immediate supervisor review & triage.',
      type: 'warning',
      link: '/admin/issues?priority=High'
    }] : []),
    ...(awaitingAssignment.length > 0 ? [{
      id: 'n2',
      title: `${awaitingAssignment.length} Report${awaitingAssignment.length > 1 ? 's' : ''} Awaiting Department Assignment`,
      desc: 'Pending dispatch to municipal service units.',
      type: 'info',
      link: '/admin/issues?status=Under+Review'
    }] : []),
    ...(recentResolved.length > 0 ? [{
      id: 'n3',
      title: 'Recent Repairs Logged',
      desc: `${recentResolved[0].id} was marked resolved recently.`,
      type: 'success',
      link: `/admin/issues/${recentResolved[0].id}`
    }] : [])
  ];

  // Helper to resolve title from current pathname
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/admin') return 'CIVIC OPERATIONS OVERVIEW';
    if (path === '/admin/issues') return 'MUNICIPAL ISSUES DISPATCH';
    if (path.startsWith('/admin/issues/')) return 'ISSUE OPERATIONAL DETAILS';
    if (path === '/admin/map') return 'CITY CIVIC MAP';
    if (path === '/admin/analytics') return 'CIVIC ANALYTICS & INSIGHTS';
    if (path === '/admin/settings') return 'ADMINISTRATIVE SETTINGS';
    return 'MUNICIPAL OPERATIONS';
  };

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setFilters({ ...filters, search: searchInput.trim() });
      if (location.pathname !== '/admin/issues') {
        navigate(`/admin/issues?search=${encodeURIComponent(searchInput.trim())}`);
      }
    }
  };

  const navItems = [
    { name: 'Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Issues', path: '/admin/issues', icon: ListFilter, count: issues.length },
    { name: 'Map', path: '/admin/map', icon: MapPin },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-civic-navy font-sans antialiased flex flex-col md:flex-row text-left">
      
      {/* ------------------------------------------------------------- */}
      {/* SIDEBAR (Desktop: Fixed 260px width, Mobile: Drawer Menu) */}
      {/* ------------------------------------------------------------- */}

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#10213F] text-white flex flex-col justify-between
        transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:z-auto
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Brand Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-700/60">
            <Link to="/admin" className="flex items-center gap-2.5 text-white" onClick={() => setMobileMenuOpen(false)}>
              <Building2 className="w-5.5 h-5.5 text-blue-400" />
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-tight text-white leading-tight">
                  Civic<span className="text-blue-400">AI</span>
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                  Municipal Operations
                </span>
              </div>
            </Link>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sidebar Section Heading */}
          <div className="px-6 pt-6 pb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              OPERATIONS
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === '/admin' 
                ? location.pathname === '/admin' 
                : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/admin'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all
                    ${isActive 
                      ? 'bg-blue-600/90 text-white font-bold shadow-xs' 
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.count !== undefined && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom Profile & Logout */}
        <div className="p-4 border-t border-slate-700/60 bg-slate-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center font-bold text-xs flex-shrink-0">
                {(currentUser?.name || "Robert Chen").split(' ').map(n => n[0]).join('')}
              </div>
              <div className="truncate text-xs">
                <div className="font-bold text-white truncate">{currentUser?.name || "Officer Robert Chen"}</div>
                <div className="text-[10px] text-slate-400 font-medium">Municipal Operations</div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                logoutUser();
                navigate('/login');
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 py-1.5 rounded transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
            <Link
              to="/"
              className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded transition-colors"
              title="Return to Public Citizen Portal"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTAINER (Top Bar + Dynamic Content) */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP BAR */}
        <header className="sticky top-0 z-30 bg-white border-b border-civic-border h-16 px-4 md:px-8 flex items-center justify-between shadow-xs">
          
          {/* Left: Mobile Toggle & Page Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-civic-navy hover:text-civic-action p-1.5 rounded border border-civic-border"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-sm md:text-base font-extrabold text-[#10213F] tracking-tight uppercase">
                {getPageTitle()}
              </h1>
              <span className="text-[10px] font-semibold text-civic-muted hidden sm:block">
                Nagpur Civic Operations Team &bull; Ward Central Dispatch
              </span>
            </div>
          </div>

          {/* Right: Search, Notifications & Profile */}
          <div className="flex items-center gap-3 md:gap-4">
            
            {/* Search Bar */}
            <form onSubmit={handleGlobalSearch} className="relative hidden sm:block w-48 md:w-64">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search report ID, ward, category..."
                className="w-full text-xs bg-slate-50 border border-civic-border rounded-lg pl-8 pr-3 py-1.5 text-civic-navy focus:outline-none focus:ring-1 focus:ring-civic-action"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </form>

            {/* Notifications Popover Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-slate-600 hover:text-civic-navy hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Operational Notifications"
              >
                <Bell className="w-4.5 h-4.5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>

              {/* Dropdown Menu */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-civic-border rounded-xl shadow-civic-normal p-4 z-50 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-civic-navy uppercase tracking-wider">
                      Operations Alerts
                    </span>
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                      {notifications.length} Active
                    </span>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-civic-muted py-3 text-center">No active operational alerts.</p>
                    ) : (
                      notifications.map(n => (
                        <Link
                          key={n.id}
                          to={n.link}
                          onClick={() => setNotificationsOpen(false)}
                          className="block bg-slate-50 hover:bg-blue-50/50 p-2.5 rounded-lg border border-slate-200 transition-colors space-y-0.5"
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-civic-navy">
                            <span>{n.title}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                          <p className="text-[11px] text-civic-muted leading-tight">{n.desc}</p>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Badge */}
            <div className="flex items-center gap-2 border-l border-civic-border pl-3 md:pl-4">
              <div className="w-8 h-8 rounded-full bg-[#10213F] text-white flex items-center justify-center text-xs font-bold font-mono">
                NC
              </div>
              <div className="hidden lg:block text-xs text-left">
                <span className="font-bold text-[#10213F] block leading-tight">Nagpur Civic Team</span>
                <span className="text-[10px] text-civic-muted font-medium">Supervisor Admin</span>
              </div>
            </div>

          </div>
        </header>

        {/* MAIN ROUTE CONTENT */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default AdminLayout;
