// Frontend demo authentication only.
// Replace with secure server-side authentication in production.

import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockIssues } from '../data/mockIssues';

const CivicContext = createContext();

export const useCivic = () => {
  const context = useContext(CivicContext);
  if (!context) {
    throw new Error('useCivic must be used within a CivicProvider');
  }
  return context;
};

export const CivicProvider = ({ children }) => {
  // Toast Notification State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedAuth = localStorage.getItem('civicai_auth');
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        if (parsed && parsed.user) return parsed.user;
      }
      const savedUser = localStorage.getItem('civic_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.warn("Corrupt authentication state in localStorage, resetting...", e);
      return null;
    }
  });

  // Issues State
  const [issues, setIssues] = useState(() => {
    try {
      const savedIssues = localStorage.getItem('civicai_issues') || localStorage.getItem('civic_issues');
      return savedIssues ? JSON.parse(savedIssues) : mockIssues;
    } catch (e) {
      console.warn("Corrupt issue state in localStorage, resetting...", e);
      return mockIssues;
    }
  });

  // Selected Issue State (for Map selection/details)
  const [selectedIssue, setSelectedIssue] = useState(null);

  // Map / List Filters State
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    priority: '',
    ward: '',
    department: '',
    search: ''
  });

  // Save issue state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('civicai_issues', JSON.stringify(issues));
    } catch (e) {
      console.error("Failed to save issues to localStorage:", e);
    }
  }, [issues]);

  // Save auth state to localStorage whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      const authObj = {
        isAuthenticated: true,
        user: currentUser
      };
      localStorage.setItem('civicai_auth', JSON.stringify(authObj));
      localStorage.setItem('civic_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('civicai_auth');
      localStorage.removeItem('civic_user');
    }
  }, [currentUser]);

  // Auth Operations
  const loginUser = (email, password, isAdminRole = false) => {
    // Frontend demo authentication logic
    const user = {
      id: isAdminRole ? "admin-demo" : "citizen-demo",
      name: isAdminRole ? "Municipal Operations" : (email ? email.split('@')[0] : "Demo Citizen"),
      email: email || (isAdminRole ? "admin@civicai.demo" : "citizen@civicai.demo"),
      role: isAdminRole ? "admin" : "citizen",
      ward: isAdminRole ? "Central Ward Operations" : "District 3"
    };
    setCurrentUser(user);
    showToast(`Logged in as ${user.name} (${user.role.toUpperCase()})`, "success");
    return user;
  };

  const loginDemoCitizen = () => {
    const citizenUser = {
      id: "citizen-demo",
      name: "Demo Citizen",
      email: "citizen@civicai.demo",
      role: "citizen",
      ward: "District 3"
    };
    setCurrentUser(citizenUser);
    showToast("Signed in as Demo Citizen", "success");
    return citizenUser;
  };

  const loginDemoAdmin = () => {
    const adminUser = {
      id: "admin-demo",
      name: "Municipal Operations",
      email: "admin@civicai.demo",
      role: "admin",
      ward: "Central Operations"
    };
    setCurrentUser(adminUser);
    showToast("Signed in as Municipal Operations Admin", "success");
    return adminUser;
  };

  const logoutUser = () => {
    setCurrentUser(null);
    setSelectedIssue(null);
    localStorage.removeItem('civicai_auth');
    localStorage.removeItem('civic_user');
    showToast("Logged out successfully.", "info");
  };

  const hasRole = (role) => {
    return currentUser?.role === role;
  };

  const isCitizen = () => {
    return currentUser?.role === 'citizen';
  };

  const isAdmin = () => {
    return currentUser?.role === 'admin';
  };

  // Issue Operations
  const reportIssue = (newIssueData) => {
    // Generate CIV-2026-XXXXXX ID
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const generatedId = `CIV-2026-${randomDigits}`;

    const newIssue = {
      id: generatedId,
      status: 'Reported',
      priority: 'Pending AI Analysis',
      reportedBy: currentUser ? currentUser.id : "anonymous",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...newIssueData,
      location: newIssueData.location || { lat: 37.7749, lng: -122.4194 } // Default SF center if not set
    };
    setIssues(prevIssues => [newIssue, ...prevIssues]);
    showToast(`Report ${generatedId} created successfully.`, "success");
    return newIssue;
  };

  const updateIssueStatus = (issueId, newStatus) => {
    updateAdminIssue(issueId, { status: newStatus });
  };

  const updateIssuePriority = (issueId, newPriority) => {
    updateAdminIssue(issueId, { priority: newPriority });
  };

  const assignDepartment = (issueId, department) => {
    updateAdminIssue(issueId, { assignedDepartment: department, status: 'Assigned' });
  };

  const getIssueById = (issueId) => {
    if (!issueId) return null;
    return issues.find(i => i.id.toUpperCase() === issueId.toUpperCase()) || null;
  };

  const applyAiAnalysis = (issueId, aiAnalysisData) => {
    setIssues(prevIssues =>
      prevIssues.map(issue =>
        issue.id === issueId
          ? {
              ...issue,
              status: 'Under Review',
              priority: aiAnalysisData.priority || issue.priority,
              assignedDepartment: issue.assignedDepartment || aiAnalysisData.recommendedDepartment,
              aiAnalysis: aiAnalysisData,
              updatedAt: new Date().toISOString()
            }
          : issue
      )
    );
    showToast("CivicAI intelligence analysis applied.", "info");
  };

  const updateCitizenFeedback = (issueId, feedback) => {
    setIssues(prevIssues =>
      prevIssues.map(issue =>
        issue.id === issueId
          ? {
              ...issue,
              citizenFeedback: feedback,
              updatedAt: new Date().toISOString()
            }
          : issue
      )
    );
    showToast("Thank you for your feedback!", "success");
  };

  const updateAdminIssue = (issueId, updates) => {
    setIssues(prevIssues =>
      prevIssues.map(issue => {
        if (issue.id !== issueId) return issue;

        const newStatus = updates.status !== undefined ? updates.status : issue.status;
        const newPriority = updates.priority !== undefined ? updates.priority : issue.priority;
        const newDept = updates.assignedDepartment !== undefined ? updates.assignedDepartment : issue.assignedDepartment;
        const newResNote = updates.resolutionNote !== undefined ? updates.resolutionNote : issue.resolutionNote;
        const assignedAt = newDept && !issue.assignedAt ? new Date().toISOString() : (issue.assignedAt || (newStatus === 'Assigned' ? new Date().toISOString() : null));

        let updatedHistory = issue.statusHistory ? [...issue.statusHistory] : [];

        if (updates.status && updates.status !== issue.status) {
          const timestamp = new Date().toISOString();
          let historyDesc = `Status updated to ${updates.status}.`;
          if (updates.status === 'Assigned' && newDept) {
            historyDesc = `Assigned to ${newDept}.`;
          } else if (updates.status === 'In Progress') {
            historyDesc = 'Field crew assigned and working on-site.';
          } else if (updates.status === 'Resolved') {
            historyDesc = newResNote ? `Resolved: ${newResNote}` : 'Issue surface repaired and inspected by ward supervisor.';
          }

          updatedHistory.push({
            status: updates.status,
            timestamp,
            description: historyDesc
          });
        }

        return {
          ...issue,
          status: newStatus,
          priority: newPriority,
          assignedDepartment: newDept,
          assignedAt: assignedAt,
          resolutionNote: newResNote,
          statusHistory: updatedHistory,
          updatedAt: new Date().toISOString()
        };
      })
    );
  };

  const deleteIssue = (issueId) => {
    setIssues(prevIssues => prevIssues.filter(issue => issue.id !== issueId));
    if (selectedIssue && selectedIssue.id === issueId) {
      setSelectedIssue(null);
    }
    showToast(`Report ${issueId} deleted.`, "info");
  };

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
    return issues.filter(issue => {
      const matchCategory = !filters.category || issue.category === filters.category;
      const matchStatus = !filters.status || issue.status === filters.status;
      const matchPriority = !filters.priority || issue.priority === filters.priority;
      const matchWard = !filters.ward || (issue.ward && issue.ward.toLowerCase().includes(filters.ward.toLowerCase()));
      const matchDept = !filters.department || (
        (issue.assignedDepartment && issue.assignedDepartment === filters.department) ||
        (issue.aiAnalysis?.recommendedDepartment && issue.aiAnalysis.recommendedDepartment === filters.department)
      );

      const searchLower = (filters.search || '').toLowerCase().trim();
      const matchSearch = !searchLower || 
        (issue.title && issue.title.toLowerCase().includes(searchLower)) ||
        (issue.description && issue.description.toLowerCase().includes(searchLower)) ||
        (issue.id && issue.id.toLowerCase().includes(searchLower)) ||
        (issue.ward && issue.ward.toLowerCase().includes(searchLower)) ||
        (issue.category && issue.category.toLowerCase().includes(searchLower)) ||
        (issue.locationText && issue.locationText.toLowerCase().includes(searchLower));

      return matchCategory && matchStatus && matchPriority && matchWard && matchDept && matchSearch;
    });
  };

  return (
    <CivicContext.Provider value={{
      currentUser,
      issues,
      filteredIssues: getFilteredIssues(),
      selectedIssue,
      filters,
      toast,
      isAuthenticated: !!currentUser,
      authStatus: !!currentUser,
      isAdmin: currentUser?.role === 'admin',
      isCitizen: currentUser?.role === 'citizen',
      
      showToast,
      setCurrentUser,
      loginUser,
      loginDemoCitizen,
      loginDemoAdmin,
      logoutUser,
      hasRole,
      reportIssue,
      updateIssueStatus,
      updateIssuePriority,
      assignDepartment,
      getIssueById,
      applyAiAnalysis,
      updateCitizenFeedback,
      updateAdminIssue,
      deleteIssue,
      setSelectedIssue,
      setFilters,
      resetFilters
    }}>
      {children}
      
      {/* Global Reusable Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#10213F] text-white font-sans text-xs font-bold px-4 py-3 rounded-lg shadow-xl border border-blue-400/60 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          <span>{toast.message}</span>
        </div>
      )}
    </CivicContext.Provider>
  );
};

