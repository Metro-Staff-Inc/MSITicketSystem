// src/WelcomeSplash.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function WelcomeSplash() {
  const navigate = useNavigate();
  const firstName = localStorage.getItem('firstName') || '';

  useEffect(() => {
    // after 2s go to the real home
    const t = setTimeout(() => {
      const role = localStorage.getItem('role');
      const dest = role === 'admin' ? '/admin' : '/';
      navigate(dest, { replace: true });
    }, 2000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(to right, #e0eafc, #cfdef3)',
        flexDirection: 'column',
      }}
    >
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
        Welcome, {firstName}!
      </h1>
      <p>Loading your dashboard…</p>
    </div>
  );
}
