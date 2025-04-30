import './index.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import TicketBoard from './TicketBoard';
import AdminPanel from './AdminPanel';
import AdminDashboard from './AdminDashboard';
import Login from './Login';
import SplashScreen from './SplashScreen';
import { useEffect, useState } from 'react';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  const role = localStorage.getItem('role'); // 👈 Added this

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <div className="min-h-screen transition-colors duration-300">
      <main className="px-6 sm:px-10 pb-10">
        <Routes>
          <Route path="/login" element={
            <Login setIsAuthenticated={(value) => {
              setIsAuthenticated(value);
              localStorage.setItem('isAuthenticated', value);
            }} />
          } />

          <Route path="/" element={
            isAuthenticated && role === 'user' ? <TicketBoard darkMode={darkMode} /> : <Navigate to="/login" />
          } />
          <Route path="/admin" element={
            isAuthenticated && role === 'admin' ? <AdminPanel /> : <Navigate to="/login" />
          } />
          <Route path="/dashboard" element={
            isAuthenticated && role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;
