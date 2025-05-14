import './index.css';
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import TicketBoard from './TicketBoard';
import AdminPanel from './AdminPanel';
import AdminDashboard from './AdminDashboard';
import Login from './Login';
import ChangePassword from './ChangePassword';
import WelcomeSplash from './WelcomeSplash';

function App() {
  const location = useLocation();

 

  // Dark mode state
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    if (darkMode) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
  }, [darkMode]);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    localStorage.getItem('isAuthenticated') === 'true'
  );

  // Role state
  const [role, setRole] = useState(
    () => localStorage.getItem('role') || ''
  );


  return (
    <div className="min-h-screen transition-colors duration-300">
      <main className="px-6 sm:px-10 pb-10">
  <Routes>
    {/* Login */}
    <Route
      path="/login"
      element={
        <Login
          setIsAuthenticated={setIsAuthenticated}
          setRole={setRole}
        />
      }
    />

    {/* Welcome Splash, shown immediately after login */}
    <Route
      path="/welcome"
      element={
        isAuthenticated ? (
          <WelcomeSplash />
        ) : (
          <Navigate to="/login" replace />
        )
      }
    />

    {/* User Ticket Board */}
    <Route
      path="/"
      element={
        isAuthenticated && (role === 'user' || role === 'manager') ? (
          <TicketBoard darkMode={darkMode} />
        ) : (
          <Navigate to="/login" replace />
        )
      }
    />

    {/* Admin Panel */}
    <Route
      path="/admin"
      element={
        isAuthenticated && (role === 'admin' || role === 'manager') ? (
          <AdminPanel role={role} />
        ) : (
          <Navigate to="/" replace />
        )
      }
    />

    {/* Change Password */}
    <Route path="/change-password" element={<ChangePassword />} />

    {/* Admin Dashboard */}
    <Route
      path="/dashboard"
      element={
        isAuthenticated && role === 'admin' ? (
          <AdminDashboard setIsAuthenticated={setIsAuthenticated} />
        ) : (
          <Navigate to="/login" replace />
        )
      }
    />

    {/* Catch‐all: redirect based on auth */}
    <Route
      path="*"
      element={
        isAuthenticated ? (
          <Navigate to={role === 'admin' ? '/admin' : '/'} replace />
        ) : (
          <Navigate to="/login" replace />
        )
      }
    />
  </Routes>
</main>

    </div>
  );
}

export default App;
