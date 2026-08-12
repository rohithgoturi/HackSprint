import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, {
  checkHealth,
  authAPI,
  complaintAPI,
  dashboardAPI,
  workerAPI,
  adminAPI,
  notificationAPI
} from '../services/api';

const CivicContext = createContext();

export const useCivic = () => {
  const context = useContext(CivicContext);
  if (!context) {
    throw new Error('useCivic must be used within a CivicProvider');
  }
  return context;
};

/**
 * Format raw backend Mongo complaint object for frontend components
 */
export const formatComplaintForFrontend = (c) => {
  if (!c) return null;
  const idStr = c._id ? c._id.toString() : (c.id || '');
  const shortCode = idStr ? `CIV-${idStr.slice(-6).toUpperCase()}` : 'CIV-000000';

  const categoryLabels = {
    road_infrastructure: 'Road Infrastructure',
    garbage_sanitation: 'Garbage & Sanitation',
    streetlight_electrical: 'Streetlight & Electrical',
    water_supply: 'Water Supply',
    drainage: 'Drainage',
    fallen_tree: 'Fallen Tree / Obstruction',
    public_infrastructure: 'Public Infrastructure',
    other: 'General Civic Concern'
  };

  const categoryDisplay = categoryLabels[c.category] || c.category || 'General';

  return {
    ...c,
    _id: idStr,
    id: idStr,
    code: shortCode,
    displayId: shortCode,
    title: c.issue || (c.description ? (c.description.length > 55 ? c.description.slice(0, 55) + '...' : c.description) : 'Civic Complaint'),
    description: c.description || '',
    category: c.category || 'other',
    categoryLabel: categoryDisplay,
    severity: c.severity || 'MEDIUM',
    priority: c.priority || 'MEDIUM',
    status: c.status || 'REPORTED',
    location: c.location && typeof c.location.latitude === 'number'
      ? { lat: c.location.latitude, lng: c.location.longitude }
      : (c.location && typeof c.location.lat === 'number' ? c.location : { lat: 21.1458, lng: 79.0882 }),
    locationText: c.locationText || (c.location && c.location.latitude ? `Lat: ${c.location.latitude}, Lng: ${c.location.longitude}` : 'Pinned Location'),
    ward: c.ward || 'Central Ward',
    assignedDepartment: c.department?.name || c.department?.code || (typeof c.department === 'string' ? c.department : null),
    departmentObj: c.department || null,
    assignedWorker: c.assignedWorker?.name || c.assignedWorker?.email || (typeof c.assignedWorker === 'string' ? c.assignedWorker : null),
    workerObj: c.assignedWorker || null,
    reportedBy: c.citizen?._id || c.citizen?.id || (typeof c.citizen === 'string' ? c.citizen : 'anonymous'),
    citizenName: c.citizen?.name || 'Citizen',
    citizenInfo: c.citizen || null,
    imageUrl: c.imageUrl || c.image || null,
    image: c.imageUrl || c.image || null,
    aiAnalysis: c.aiAnalysis || null,
    priorityExplanation: c.priorityExplanation || [],
    sla: c.sla || null,
    statusHistory: c.history || c.statusHistory || [],
    createdAt: c.createdAt || new Date().toISOString(),
    updatedAt: c.updatedAt || new Date().toISOString()
  };
};

export const CivicProvider = ({ children }) => {
  // Toast Notification State
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  }, []);

  // State Definitions
  const [currentUser, setCurrentUser] = useState(null);
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Admin / Worker Data Cache
  const [adminStats, setAdminStats] = useState(null);
  const [citizenStats, setCitizenStats] = useState(null);
  const [workersList, setWorkersList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [notificationsList, setNotificationsList] = useState([]);

  // Map / List Filters State
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    priority: '',
    ward: '',
    department: '',
    search: ''
  });

  // Normalize user object from backend to frontend role names
  const normalizeUserRole = (u) => {
    if (!u) return null;
    const roleLower = (u.role || 'citizen').toLowerCase();
    let normRole = 'citizen';
    if (roleLower === 'admin') normRole = 'admin';
    else if (roleLower === 'field_worker' || roleLower === 'worker') normRole = 'worker';

    return {
      ...u,
      id: u._id || u.id,
      role: normRole,
      rawRole: u.role,
      ward: u.ward || (normRole === 'admin' ? 'Central Operations' : 'District 3')
    };
  };

  // Fetch current authenticated user on mount if token exists
  const loadCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('civic_token');
    if (!token) {
      setCurrentUser(null);
      return;
    }

    try {
      const res = await authAPI.getMe();
      if (res.data && res.data.success && res.data.data.user) {
        const user = normalizeUserRole(res.data.data.user);
        setCurrentUser(user);
      }
    } catch (err) {
      console.warn('[Auth Check] Failed to restore authenticated session:', err.message);
      localStorage.removeItem('civic_token');
      localStorage.removeItem('civic_user');
      localStorage.removeItem('civicai_auth');
      setCurrentUser(null);
    }
  }, []);

  // Fetch all complaints from backend
  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await complaintAPI.getAll();
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        const formatted = res.data.data.map(formatComplaintForFrontend);
        setIssues(formatted);
      } else {
        setIssues([]);
      }
    } catch (err) {
      console.error('[API Fetch Complaints Error]', err);
      setError(err.message || 'Failed to load complaints from backend');
    } finally {
      setLoading(false);
    }
  }, []);

  // Mount Effect
  useEffect(() => {
    checkHealth()
      .then((data) => console.log('[API Health Check] Connected to backend:', data))
      .catch((err) => console.warn('[API Health Check Warning]:', err.message));

    loadCurrentUser();
    fetchComplaints();
  }, [loadCurrentUser, fetchComplaints]);

  // Auth Operations
  const loginUser = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authAPI.login({ email, password });
      if (res.data && res.data.success && res.data.data.token) {
        const { token, user: rawUser } = res.data.data;
        localStorage.setItem('civic_token', token);
        const user = normalizeUserRole(rawUser);
        setCurrentUser(user);
        localStorage.setItem('civic_user', JSON.stringify(user));
        showToast(`Logged in as ${user.name} (${user.rawRole})`, 'success');
        fetchComplaints();
        return user;
      }
      throw new Error(res.data?.message || 'Login failed');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Authentication failed';
      setError(msg);
      showToast(msg, 'error');
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const loginDemoCitizen = async () => {
    try {
      return await loginUser('citizena_p3@civic.local', 'CitizenPassword123!');
    } catch (err) {
      // Try registering default demo citizen if not found
      try {
        await authAPI.register({
          name: 'Citizen A',
          email: 'citizena_p3@civic.local',
          password: 'CitizenPassword123!',
          phone: '9876543210'
        });
        return await loginUser('citizena_p3@civic.local', 'CitizenPassword123!');
      } catch (regErr) {
        showToast('Demo Citizen login failed', 'error');
      }
    }
  };

  const loginDemoAdmin = async () => {
    try {
      return await loginUser('admin@civic.local', 'AdminPassword123!');
    } catch (err) {
      showToast('Demo Admin login failed', 'error');
    }
  };

  const loginDemoWorker = async () => {
    try {
      return await loginUser('worker@civic.local', 'WorkerPassword123!');
    } catch (err) {
      showToast('Demo Worker login failed', 'error');
    }
  };

  const logoutUser = () => {
    setCurrentUser(null);
    setSelectedIssue(null);
    localStorage.removeItem('civic_token');
    localStorage.removeItem('civic_user');
    localStorage.removeItem('civicai_auth');
    showToast('Logged out successfully.', 'info');
  };

  const hasRole = (role) => currentUser?.role === role;
  const isCitizen = () => currentUser?.role === 'citizen';
  const isAdmin = () => currentUser?.role === 'admin';
  const isWorker = () => currentUser?.role === 'worker';

  // Complaint Operations
  const reportIssue = async (newIssueData) => {
    setLoading(true);
    try {
      const payload = {
        description: newIssueData.description || newIssueData.title,
        imageUrl: newIssueData.image || newIssueData.imageUrl || null,
        location: newIssueData.location
          ? {
              latitude: Number(newIssueData.location.lat || newIssueData.location.latitude || 21.1458),
              longitude: Number(newIssueData.location.lng || newIssueData.location.longitude || 79.0882)
            }
          : null
      };

      const res = await complaintAPI.create(payload);
      if (res.data && res.data.success && res.data.data) {
        const formatted = formatComplaintForFrontend(res.data.data);
        setIssues((prev) => [formatted, ...prev]);
        showToast(`Report ${formatted.code} submitted successfully.`, 'success');
        return formatted;
      }
      throw new Error(res.data?.message || 'Failed to submit complaint');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error submitting report';
      showToast(msg, 'error');
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const getIssueById = (issueId) => {
    if (!issueId) return null;
    const target = String(issueId).toUpperCase().trim();
    return (
      issues.find(
        (i) =>
          (i.id && String(i.id).toUpperCase() === target) ||
          (i._id && String(i._id).toUpperCase() === target) ||
          (i.code && String(i.code).toUpperCase() === target) ||
          (i.displayId && String(i.displayId).toUpperCase() === target)
      ) || null
    );
  };

  const triggerAiAnalysis = async (issueId) => {
    setLoading(true);
    try {
      const res = await complaintAPI.analyze(issueId);
      if (res.data && res.data.success && res.data.data.complaint) {
        const updated = formatComplaintForFrontend(res.data.data.complaint);
        setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        showToast('CivicAI analysis completed successfully.', 'success');
        return updated;
      }
      throw new Error('AI analysis failed');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'AI Analysis failed';
      showToast(msg, 'error');
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const updateIssueStatus = async (issueId, newStatus, note) => {
    try {
      const res = await complaintAPI.updateStatus(issueId, { status: newStatus, note });
      if (res.data && res.data.success && res.data.data.complaint) {
        const updated = formatComplaintForFrontend(res.data.data.complaint);
        setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        showToast(`Status updated to ${newStatus}`, 'success');
        return updated;
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Status update failed';
      showToast(msg, 'error');
    }
  };

  const updateIssuePriority = async (issueId, newPriority, reason) => {
    try {
      const res = await complaintAPI.overridePriority(issueId, { priority: newPriority, reason });
      if (res.data && res.data.success && res.data.data.complaint) {
        const updated = formatComplaintForFrontend(res.data.data.complaint);
        setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        showToast(`Priority updated to ${newPriority}`, 'success');
        return updated;
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Priority update failed';
      showToast(msg, 'error');
    }
  };

  const assignDepartment = async (issueId, category, reason) => {
    try {
      const res = await complaintAPI.overrideDepartment(issueId, { category, reason });
      if (res.data && res.data.success && res.data.data.complaint) {
        const updated = formatComplaintForFrontend(res.data.data.complaint);
        setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        showToast('Department re-routed successfully', 'success');
        return updated;
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Department assignment failed';
      showToast(msg, 'error');
    }
  };

  const assignWorker = async (issueId, workerId, note) => {
    try {
      const res = await complaintAPI.assignWorker(issueId, { workerId, note });
      if (res.data && res.data.success && res.data.data.complaint) {
        const updated = formatComplaintForFrontend(res.data.data.complaint);
        setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        showToast('Worker assigned successfully', 'success');
        return updated;
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Worker assignment failed';
      showToast(msg, 'error');
    }
  };

  const fetchCitizenDashboard = useCallback(async () => {
    try {
      const res = await dashboardAPI.getCitizenDashboard();
      if (res.data && res.data.success) {
        setCitizenStats(res.data.data);
        return res.data.data;
      }
    } catch (err) {
      console.warn('[Citizen Dashboard Error]', err.message);
    }
  }, []);

  const fetchAdminDashboard = useCallback(async () => {
    try {
      const res = await dashboardAPI.getAdminDashboard();
      if (res.data && res.data.success) {
        setAdminStats(res.data.data);
        return res.data.data;
      }
    } catch (err) {
      console.warn('[Admin Dashboard Error]', err.message);
    }
  }, []);

  const fetchWorkers = useCallback(async () => {
    try {
      const res = await adminAPI.getWorkers();
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        setWorkersList(res.data.data);
        return res.data.data;
      }
    } catch (err) {
      console.warn('[Fetch Workers Error]', err.message);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await adminAPI.getDepartments();
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        setDepartmentsList(res.data.data);
        return res.data.data;
      }
    } catch (err) {
      console.warn('[Fetch Departments Error]', err.message);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationAPI.getAll();
      if (res.data && res.data.success && Array.isArray(res.data.data?.notifications)) {
        setNotificationsList(res.data.data.notifications);
        return res.data.data.notifications;
      }
    } catch (err) {
      console.warn('[Notifications Fetch Error]', err.message);
    }
  }, []);

  const resetFilters = () => {
    setFilters({
      category: '',
      status: '',
      priority: '',
      ward: '',
      department: '',
      search: ''
    });
  };

  // Helper function to get filtered issues
  const getFilteredIssues = () => {
    return issues.filter((issue) => {
      const matchCategory = !filters.category || issue.category === filters.category;
      const matchStatus = !filters.status || issue.status === filters.status;
      const matchPriority = !filters.priority || issue.priority === filters.priority;
      const matchWard = !filters.ward || (issue.ward && issue.ward.toLowerCase().includes(filters.ward.toLowerCase()));
      const matchDept =
        !filters.department ||
        (issue.assignedDepartment && issue.assignedDepartment === filters.department) ||
        (issue.aiAnalysis?.departmentRecommendation && issue.aiAnalysis.departmentRecommendation === filters.department);

      const searchLower = (filters.search || '').toLowerCase().trim();
      const matchSearch =
        !searchLower ||
        (issue.title && issue.title.toLowerCase().includes(searchLower)) ||
        (issue.description && issue.description.toLowerCase().includes(searchLower)) ||
        (issue.id && issue.id.toLowerCase().includes(searchLower)) ||
        (issue.code && issue.code.toLowerCase().includes(searchLower)) ||
        (issue.ward && issue.ward.toLowerCase().includes(searchLower)) ||
        (issue.category && issue.category.toLowerCase().includes(searchLower));

      return matchCategory && matchStatus && matchPriority && matchWard && matchDept && matchSearch;
    });
  };

  return (
    <CivicContext.Provider
      value={{
        currentUser,
        issues,
        filteredIssues: getFilteredIssues(),
        selectedIssue,
        filters,
        toast,
        loading,
        error,
        adminStats,
        citizenStats,
        workersList,
        departmentsList,
        notificationsList,

        isAuthenticated: !!currentUser,
        authStatus: !!currentUser,
        isAdmin: currentUser?.role === 'admin',
        isCitizen: currentUser?.role === 'citizen',
        isWorker: currentUser?.role === 'worker',

        showToast,
        setCurrentUser,
        loginUser,
        loginDemoCitizen,
        loginDemoAdmin,
        loginDemoWorker,
        logoutUser,
        hasRole,
        fetchComplaints,
        reportIssue,
        updateIssueStatus,
        updateIssuePriority,
        assignDepartment,
        assignWorker,
        getIssueById,
        triggerAiAnalysis,
        fetchCitizenDashboard,
        fetchAdminDashboard,
        fetchWorkers,
        fetchDepartments,
        fetchNotifications,
        setSelectedIssue,
        setFilters,
        resetFilters
      }}
    >
      {children}

      {/* Global Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#10213F] text-white font-sans text-xs font-bold px-4 py-3 rounded-lg shadow-xl border border-blue-400/60 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          <span>{toast.message}</span>
        </div>
      )}
    </CivicContext.Provider>
  );
};
