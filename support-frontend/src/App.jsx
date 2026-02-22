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
import ApprovalDashboard from './pages/ApprovalDashboard'; 

// ✅ NEW: Import Executive Reports
import ExecutiveReports from './pages/ExecutiveReports'; 

// Import BOTH Asset Pages
import AssetManagement from './pages/AssetManagement';       // Admin version
import BranchAssetManagement from './pages/BranchAssetManagement'; // Branch version

import { NotificationProvider } from './context/NotificationContext';

// --- 1. Smart Route Guard ---
// This component checks if the user's role is in the 'allowedRoles' array
const RoleRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  
  if (!token) return <Navigate to="/login" replace />;
  
  if (!allowedRoles.includes(role)) {
    // If unauthorized, send them to their specific home page
    if (role === 'ADMIN') return <Navigate to="/admin-dashboard" replace />;
    if (['SUPER_ADMIN', 'ACCOUNT_HEAD'].includes(role)) return <Navigate to="/approvals" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Layout>{children}</Layout>;
};

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

function App() {
  const role = localStorage.getItem('role'); 

  // Redirect Logic based on Role (for root path)
  const getHomeRoute = () => {
    if (!role) return "/login";
    if (role === 'ADMIN') return "/admin-dashboard";
    if (role === 'SUPER_ADMIN' || role === 'ACCOUNT_HEAD') return "/approvals"; 
    return "/dashboard"; // Branch User
  };

  return (
    <NotificationProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to={getHomeRoute()} replace />} />
        <Route path="/login" element={<Login />} />

        {/* ✅ SHARED ROUTES (Everyone gets the Layout) */}
        <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

        {/* BRANCH USER ROUTES */}
        <Route path="/dashboard" element={<RoleRoute allowedRoles={['BRANCH_USER']}><BranchDashboard /></RoleRoute>} />
        <Route path="/create-ticket" element={<RoleRoute allowedRoles={['BRANCH_USER']}><CreateTicket /></RoleRoute>} />

        {/* ASSET ROUTING */}
        <Route 
          path="/assets" 
          element={
            <ProtectedRoute>
              {/* Only IT ADMIN gets the full management suite. Others get the read-only/branch view */}
              {role === 'ADMIN' ? <AssetManagement /> : <BranchAssetManagement />}
            </ProtectedRoute>
          } 
        />

        {/* IT ADMIN EXCLUSIVE ROUTES */}
        <Route path="/admin-dashboard" element={<RoleRoute allowedRoles={['ADMIN']}><AdminDashboard /></RoleRoute>} />
        <Route path="/admin/settings" element={<RoleRoute allowedRoles={['ADMIN']}><Settings /></RoleRoute>} />
        <Route path="/dashboard/reliability" element={<RoleRoute allowedRoles={['ADMIN']}><ReliabilityDashboard /></RoleRoute>} />

        {/* USER MANAGEMENT (IT Admin + Super Admin) */}
        {/* Super Admin needs this to create Account Heads */}
        <Route path="/admin/users" element={<RoleRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><ManageUsers /></RoleRoute>} /> 

        {/* REPORTS (IT Admin + Super Admin + Finance) */}
        <Route path="/admin/reports" element={<RoleRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'ACCOUNT_HEAD']}><Reports /></RoleRoute>} />

        {/* ✅ EXECUTIVE ANALYTICS (Super Admin + Finance Only) */}
        <Route path="/analytics" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'ACCOUNT_HEAD']}><ExecutiveReports /></RoleRoute>} />

        {/* APPROVAL WORKFLOW (Super Admin + Finance) */}
        <Route path="/approvals" element={<RoleRoute allowedRoles={['SUPER_ADMIN', 'ACCOUNT_HEAD']}><ApprovalDashboard /></RoleRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </NotificationProvider>
  );
}

export default App;