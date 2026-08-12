import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Report from './pages/Report';
import Track from './pages/Track';
import MapPage from './pages/Map';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Analyze from './pages/Analyze';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="report" element={<Report />} />
        <Route path="analyze/:id" element={<Analyze />} />
        <Route path="track" element={<Track />} />
        <Route path="map" element={<MapPage />} />
        <Route path="login" element={<Login />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="admin" element={<Admin />} />
        <Route path="*" element={
          <div className="py-12 text-center">
            <h2 className="text-xl font-bold text-civic-navy">Page Not Found</h2>
            <p className="text-xs text-civic-muted mt-2">The page you are looking for does not exist or has been moved.</p>
          </div>
        } />
      </Route>
    </Routes>
  );
}

export default App;
