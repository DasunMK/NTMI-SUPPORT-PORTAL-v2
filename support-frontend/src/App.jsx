import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import BranchDashboard from './pages/BranchDashboard'; // Import the new page

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      
      {/* Use the Real Dashboard Component here */}
      <Route path="/dashboard" element={<BranchDashboard />} />
      
      <Route path="/admin-dashboard" element={<h1>Admin Dashboard (Coming Soon)</h1>} />
    </Routes>
  );
}

export default App;