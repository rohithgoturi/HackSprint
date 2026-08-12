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
  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('civic_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Issues State
  const [issues, setIssues] = useState(() => {
    const savedIssues = localStorage.getItem('civicai_issues') || localStorage.getItem('civic_issues');
    return savedIssues ? JSON.parse(savedIssues) : mockIssues;
  });

  // Selected Issue State (for Map selection/details)
  const [selectedIssue, setSelectedIssue] = useState(null);

  // Map / List Filters State
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    priority: '',
    ward: '',
    search: ''
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('civicai_issues', JSON.stringify(issues));
  }, [issues]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('civic_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('civic_user');
    }
  }, [currentUser]);

  // Auth Operations
  const loginUser = (email, password, isAdmin = false) => {
    // Basic mock authentication
    const user = {
      id: isAdmin ? "ADM-302" : "USR-101",
      name: isAdmin ? "Officer Robert Chen" : "Resident Sarah Jenkins",
      email: email,
      role: isAdmin ? "admin" : "resident",
      ward: isAdmin ? "District 6" : "District 3"
    };
    setCurrentUser(user);
    return user;
  };

  const logoutUser = () => {
    setCurrentUser(null);
    setSelectedIssue(null);
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...newIssueData,
      location: newIssueData.location || { lat: 37.7749, lng: -122.4194 } // Default SF center if not set
    };
    setIssues(prevIssues => [newIssue, ...prevIssues]);
    return newIssue;
  };

  const updateIssueStatus = (issueId, newStatus) => {
    setIssues(prevIssues =>
      prevIssues.map(issue =>
        issue.id === issueId
          ? { ...issue, status: newStatus, updatedAt: new Date().toISOString() }
          : issue
      )
    );
  };

  const updateIssuePriority = (issueId, newPriority) => {
    setIssues(prevIssues =>
      prevIssues.map(issue =>
        issue.id === issueId
          ? { ...issue, priority: newPriority, updatedAt: new Date().toISOString() }
          : issue
      )
    );
  };

  const applyAiAnalysis = (issueId, aiAnalysisData) => {
    setIssues(prevIssues =>
      prevIssues.map(issue =>
        issue.id === issueId
          ? {
              ...issue,
              status: 'Under Review',
              priority: aiAnalysisData.priority || issue.priority,
              aiAnalysis: aiAnalysisData,
              updatedAt: new Date().toISOString()
            }
          : issue
      )
    );
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
  };

  const deleteIssue = (issueId) => {
    setIssues(prevIssues => prevIssues.filter(issue => issue.id !== issueId));
    if (selectedIssue && selectedIssue.id === issueId) {
      setSelectedIssue(null);
    }
  };

  const resetFilters = () => {
    setFilters({
      category: '',
      status: '',
      priority: '',
      ward: '',
      search: ''
    });
  };

  // Helper function to get filtered issues
  const getFilteredIssues = () => {
    return issues.filter(issue => {
      const matchCategory = !filters.category || issue.category === filters.category;
      const matchStatus = !filters.status || issue.status === filters.status;
      const matchPriority = !filters.priority || issue.priority === filters.priority;
      const matchWard = !filters.ward || issue.ward.toLowerCase().includes(filters.ward.toLowerCase());
      
      const searchLower = filters.search.toLowerCase();
      const matchSearch = !filters.search || 
        issue.title.toLowerCase().includes(searchLower) ||
        issue.description.toLowerCase().includes(searchLower) ||
        issue.id.toLowerCase().includes(searchLower);

      return matchCategory && matchStatus && matchPriority && matchWard && matchSearch;
    });
  };

  return (
    <CivicContext.Provider value={{
      currentUser,
      issues,
      filteredIssues: getFilteredIssues(),
      selectedIssue,
      filters,
      authStatus: !!currentUser,
      isAdmin: currentUser?.role === 'admin',
      
      setCurrentUser,
      loginUser,
      logoutUser,
      reportIssue,
      updateIssueStatus,
      updateIssuePriority,
      applyAiAnalysis,
      updateCitizenFeedback,
      deleteIssue,
      setSelectedIssue,
      setFilters,
      resetFilters
    }}>
      {children}
    </CivicContext.Provider>
  );
};
