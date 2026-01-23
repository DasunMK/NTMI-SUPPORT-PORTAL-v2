import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Help from './pages/Help';
import Profile from './pages/Profile';
import NotificationsPage from './pages/NotificationsPage';
import BranchDashboard from './pages/BranchDashboard';
import CreateTicket from './pages/CreateTicket';
import AdminDashboard from './pages/AdminDashboard';
import ManageUsers from './pages/ManageUsers'; 
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ReliabilityDashboard from './pages/ReliabilityDashboard';

// ✅ Import BOTH Asset Pages
import AssetManagement from './pages/AssetManagement';       // Admin version
import BranchAssetManagement from './pages/BranchAssetManagement'; // Branch version

import { NotificationProvider } from './context/NotificationContext';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!token) return <Navigate to="/login" replace />;
  if (role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
};

function App() {
  const role = localStorage.getItem('role'); // Get role to decide which asset page to show

  return (
    <NotificationProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/help" element={<Help />} />

        {/* SHARED ROUTES */}
        <Route path="/dashboard" element={<ProtectedRoute><BranchDashboard /></ProtectedRoute>} />
        <Route path="/create-ticket" element={<ProtectedRoute><CreateTicket /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

        {/* ✅ SMART ASSET ROUTING */}
        <Route 
          path="/assets" 
          element={
            <ProtectedRoute>
              {role === 'ADMIN' ? <AssetManagement /> : <BranchAssetManagement />}
            </ProtectedRoute>
          } 
        />

        {/* ADMIN ROUTES */}
        <Route path="/admin-dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><ManageUsers /></AdminRoute>} /> 
        <Route path="/admin/reports" element={<AdminRoute><Reports /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><Settings /></AdminRoute>} />
        <Route path="/dashboard/reliability" element={<AdminRoute><ReliabilityDashboard /></AdminRoute>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </NotificationProvider>
  );
}

export default App;