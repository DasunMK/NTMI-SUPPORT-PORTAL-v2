import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import BranchDashboard from './pages/BranchDashboard';
import CreateTicket from './pages/CreateTicket';
import Profile from './pages/Profile';
import Help from './pages/Help';
import Layout from './components/Layout';

// --- ADMIN PAGES ---
// ⚠️ IMPORTANT: Ensure these files actually exist in this folder structure!
// If you created AdminDashboard.jsx directly in 'pages', remove the '/admin' part below.
import AdminDashboard from './pages/admin/AdminDashboard'; 
import ManageUsers from './pages/admin/ManageUsers';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      
      {/* --- Protected Routes --- */}
      
      {/* 1. Branch / Standard User Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <BranchDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/create-ticket" 
        element={
          <ProtectedRoute>
            <CreateTicket />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />

      <Route 
          path="/help" 
          element={
            <ProtectedRoute>
              <Help />
            </ProtectedRoute>
          } 
        />

      {/* 2. Admin Routes */}
      {/* 🛠️ FIX: Changed path from "/admin/dashboard" to "/admin-dashboard" to match Login redirect */}
      <Route 
        path="/admin-dashboard" 
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/admin/users" 
        element={
          <ProtectedRoute>
            <ManageUsers />
          </ProtectedRoute>
        } 
      />

      <Route path="/admin/reports" element={<ProtectedRoute><h1>Admin Reports Page</h1></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute><h1>Admin Settings Page</h1></ProtectedRoute>} />

      {/* 3. Catch-All Route (Fixes blank screens for unknown URLs) */}
      <Route path="*" element={<Navigate to="/login" />} />

    </Routes>
  );
}

export default App;