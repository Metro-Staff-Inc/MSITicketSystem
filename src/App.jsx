import './index.css';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import TicketBoard from './TicketBoard';
import AdminPanel from './AdminPanel';
import AdminDashboard from './AdminDashboard';
import Login from './Login';
import SplashScreen from './SplashScreen';
import React, { useEffect, useState } from 'react';

function App() {
  const location = useLocation();

  // Splash screen on every /login load or refresh
  const [showSplash, setShowSplash] = useState(false);
  useEffect(() => {
    if (location.pathname === '/login') {
      setShowSplash(true);
      const timer = setTimeout(() => setShowSplash(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

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
  const [role, setRole] = useState('');
  useEffect(() => {
    const savedRole = localStorage.getItem('role');
    setRole(savedRole);
    setIsAuthenticated(localStorage.getItem('isAuthenticated') === 'true');
  }, []);

  // Show splash if on /login
  if (showSplash && location.pathname === '/login') {
    return <SplashScreen />;
  }

  return (
    <div className="min-h-screen transition-colors duration-300">
      <main className="px-6 sm:px-10 pb-10">
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                role === 'admin' ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Navigate to="/" replace />
                )
              ) : (
                <Login
                  setIsAuthenticated={(value) => {
                    setIsAuthenticated(value);
                    localStorage.setItem('isAuthenticated', value);
                  }}
                  setRole={(value) => {
                    setRole(value);
                    localStorage.setItem('role', value);
                  }}
                />
              )
            }
          />
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
          <Route
            path="/dashboard"
            element={
              isAuthenticated && role === 'admin' ? (
                <AdminDashboard />
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
