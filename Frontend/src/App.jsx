import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Report from './pages/Report';
import Track from './pages/Track';
import MapPage from './pages/Map';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Analyze from './pages/Analyze';
import MyReports from './pages/MyReports';
import NotFound from './pages/NotFound';

// Admin Sub-pages
import AdminOverview from './pages/admin/AdminOverview';
import AdminIssues from './pages/admin/AdminIssues';
import AdminIssueDetail from './pages/admin/AdminIssueDetail';
import AdminMap from './pages/admin/AdminMap';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminSettings from './pages/admin/AdminSettings';

function App() {
  return (
    <Routes>
      {/* Public Citizen Portal Routes */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="report" element={<Report />} />
        <Route path="analyze/:id" element={<Analyze />} />
        <Route path="track" element={<Track />} />
        <Route path="map" element={<MapPage />} />
        <Route path="login" element={<Login />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route 
          path="reports" 
          element={
            <ProtectedRoute requiredRole="citizen">
              <MyReports />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/* Municipal Operations / Admin Dashboard Routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="issues" element={<AdminIssues />} />
        <Route path="issues/:id" element={<AdminIssueDetail />} />
        <Route path="map" element={<AdminMap />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={
        <MainLayout>
          <NotFound />
        </MainLayout>
      } />
    </Routes>
  );
}

export default App;


