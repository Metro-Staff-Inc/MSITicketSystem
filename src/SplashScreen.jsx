import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function SplashScreen() {
  const logos = [
    '/MSITrans.png',
    '/AWTrans.png',
    '/BACTrans.png',
    '/ConfirmifyTrans.png'
  ];

  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => {
        if (prevIndex < logos.length - 1) {
          return prevIndex + 1;
        } else {
          return prevIndex; // Stay on last logo (Confirmify)
        }
      });
    }, 1000);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      navigate('/login'); // Move to login
    }, 5000); // <<< 5 seconds TOTAL

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div
      className="d-flex justify-content-center align-items-center min-vh-100"
      style={{
        background: 'linear-gradient(to right, #e0eafc, #cfdef3)',
        transition: 'background 0.3s ease',
      }}
    >
      <img
        src={logos[index]}
        alt="Logo"
        style={{ maxWidth: '300px', height: 'auto', animation: 'fade-in 1s ease-in-out' }}
      />
    </div>
  );
}

export default SplashScreen;
