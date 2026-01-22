import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

// --- PAGES ---
import Login from './pages/Login';
import BranchDashboard from './pages/BranchDashboard';
import CreateTicket from './pages/CreateTicket';
import Profile from './pages/Profile';
import Help from './pages/Help';
import AdminDashboard from './pages/AdminDashboard';
import ManageUsers from './pages/ManageUsers'; 
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import NotificationsPage from './pages/NotificationsPage'; // ✅ 1. Import New Page
import { NotificationProvider } from './context/NotificationContext';

// --- 1. Basic Protection ---
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
};

// --- 2. Admin Protection ---
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) return <Navigate to="/login" replace />;
  if (role !== 'ADMIN') return <Navigate to="/dashboard" replace />;

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <NotificationProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* Help is Public */}
        <Route path="/help" element={<Help />} />

        {/* Branch / Shared Routes (Protected) */}
        <Route path="/dashboard" element={<ProtectedRoute><BranchDashboard /></ProtectedRoute>} />
        <Route path="/create-ticket" element={<ProtectedRoute><CreateTicket /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        
        {/* ✅ 2. Add Notifications Route (Shared) */}
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin-dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/reports" element={<AdminRoute><Reports /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><Settings /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><ManageUsers /></AdminRoute>} /> 

        {/* Catch All */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </NotificationProvider>
  );
}

export default App;