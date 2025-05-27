import React, { useEffect, useState } from 'react';
import { Form, Button, Card, Container, InputGroup, Alert } from 'react-bootstrap';
import { Moon, Sun, Eye, EyeSlash } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTickets } from './TicketContext';

const API_BASE = "https://ticketing-api-z0gp.onrender.com";



function Login({ setIsAuthenticated, setRole }) {
  const [darkMode, setDarkMode] = useState(() => {
    return document.body.classList.contains('dark') || false;
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [company, setCompany] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { reloadTickets } = useTickets();
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registerError, setRegisterError]     = useState('');





  const navigate = useNavigate();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  
  const handleLogin = async (e) => {
  e.preventDefault();
  console.log("🔑 handleLogin fired with", { email: loginEmail });
  setLoginError('');

  try {
    console.log("🔄 Logging in with email:", loginEmail);
    const res = await axios.post(`${API_BASE}/login`, {
      email: loginEmail,
      password: loginPassword
    });
    console.log("🔍 login response data:", res.data);


    // ← pull role + first_name, normalize role, and save firstName
    const { role, first_name } = res.data;
    const userRole = role.toLowerCase();
    localStorage.setItem('firstName', first_name);
    

    // ← your existing auth setup
    setIsAuthenticated(true);
    setRole(userRole);
    // ← after setRole, before reloadTickets()
    const profileRes = await axios.get(`${API_BASE}/users?email=${loginEmail}`);
// Find the exact user object in the array:
const matched = profileRes.data.find(u =>
  u.email.toLowerCase() === loginEmail.toLowerCase()
);
const userCompany = matched?.company || "";
console.log("🏷️ Matched company:", userCompany);
localStorage.setItem('company', userCompany);


    localStorage.setItem('userEmail', loginEmail);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('role', userRole);

    // ← fetch tickets once
    reloadTickets();

    // send everyone to the welcome splash
    console.log("🚀 redirecting to welcome");
    navigate('/welcome', { replace: true });
    

  } catch (err) {
    console.error("❌ login failed:", err.response?.data || err);
    setLoginError(err.response?.data?.detail || 'Login failed');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('role');
    setIsAuthenticated(false);
  }
};


  const handleRegister = async (e) => {
  e.preventDefault();
  setRegisterError('');
  setRegisterSuccess(false);

  if (registerPassword !== confirmPassword) {
    setRegisterError("Passwords do not match");
    return;
  }

  const payload = {
    first_name: firstName,
    last_name:  lastName,
    email:      registerEmail,
    company:    company,
    password:   registerPassword,
    // no send_welcome_email here, defaults to false
  };

  try {
    const res = await axios.post(`${API_BASE}/register`, payload);
    if (res.status === 200) {
      setRegisterSuccess(res.data.message || 'Registered successfully!');
      setTimeout(() => {
        setShowRegister(false);
        setRegisterSuccess(false);
      }, 2000);
    }




    // clear form fields
    setFirstName('');
    setLastName('');
    setRegisterEmail('');
    setCompany('');
    setRegisterPassword('');
    setConfirmPassword('');
    // keep the modal open so they see the message
  } catch (err) {
    setRegisterError(err.response?.data?.detail || 'Registration failed');
  }
};

  
  
  const logos = [
    '/MSITrans.png',
    '/AWTrans.png',
    '/BACTrans.png',
    '/ConfirmifyTrans.png'
  ];

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    document.body.classList.toggle('dark', isDark);
  }, []);
  
  // Prevent default and navigate to Change Password page
const handleForgot = (e) => {
  e.preventDefault();
  navigate(`/change-password?email=${encodeURIComponent(loginEmail)}`);
};

  
  return (
    <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      transition: 'background 0.5s',
    }}    
    >
      {/* Logos across top */}
      <div
        className="top-logos"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px',
          paddingTop: '200px',
          paddingBottom: '20px',
        }}
      >
        {logos.map((logo, idx) => (
          <React.Fragment key={idx}>
            <img
              src={logo}
              alt={`Logo ${idx}`}
              style={{
                height: '100px',
                maxWidth: '160px',
                objectFit: 'contain',
              }}
            />
            {idx < logos.length - 1 && (
              <span
                style={{
                  color: darkMode ? 'white' : 'black',
                  fontSize: '24px',
                  margin: '0 10px',
                }}
              >
                |
              </span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Centered Login Form */}
      <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Container style={{ maxWidth: '400px', width: '90%' }}>
          <Card
            style={{
              border: 'none',
              borderRadius: '15px',
              backgroundColor: darkMode ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(15px)',
              color: darkMode ? 'white' : 'black',
            }}
          >
            <Card.Body>
            {loginError && (
    <Alert variant="danger" className="mb-3">
      {loginError}
    </Alert>
  )}
              <Form onSubmit={handleLogin}>
                <Form.Group className="mb-3" controlId="formEmail">
                  <Form.Label style={{ color: darkMode ? 'white' : 'black' }}>
                    Email address
                  </Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className={darkMode ? 'bg-dark text-white border-secondary' : ''}
                  />

                </Form.Group>

                <Form.Group className="mb-3" controlId="formPassword">
                  <Form.Label style={{ color: darkMode ? 'white' : 'black' }}>
                    Password
                  </Form.Label>
                  <InputGroup>
                  <Form.Control
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className={darkMode ? 'bg-dark text-white border-secondary' : ''}
                  />

                    <Button
                      variant={darkMode ? 'secondary' : 'outline-secondary'}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeSlash /> : <Eye />}
                    </Button>
                  </InputGroup>
                </Form.Group>

                <Form.Group className="d-flex justify-content-between align-items-center mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Remember me"
                    className={darkMode ? 'text-white' : ''}
                  />
                  <a
                    href={`/change-password?email=${encodeURIComponent(loginEmail)}`}
                    onClick={handleForgot}
                    style={{ color: darkMode ? 'white' : '#6c757d', textDecoration: 'none' }}
                  >
                   Forgot password?
                  </a>
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button variant="primary" type="submit">
                    Login
                  </Button>
                </div>
              </Form>

              {/* Separate Register Button */}
              <div className="d-grid gap-2 mt-3">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowRegister(true)}
                >
                  Register
                </Button>
              </div>

            </Card.Body>
          </Card>
        </Container>
      </div>

      {/* Register Modal */}
      {showRegister && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            animation: 'slideUp 0.5s',
          }}
        >
          <Card
            style={{
              width: '400px',
              padding: '20px',
              borderRadius: '15px',
              backgroundColor: darkMode ? 'rgba(50,50,50,0.95)' : 'white',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Card.Body>
              <h3 className="mb-4 text-center" style={{ color: darkMode ? 'white' : 'black', fontWeight: 'bold', opacity: 1 }}>
                Register
              </h3>
              {registerError && (
                <Alert variant="danger" className="mb-3">
                  {registerError}
                </Alert>
              )}
              {registerSuccess && (
                <Alert variant="success" className="mb-3">
                  {registerSuccess}
                </Alert>
              )}
              <Form onSubmit={handleRegister}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ color: darkMode ? 'white' : 'black' }}>First Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label style={{ color: darkMode ? 'white' : 'black' }}>Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label style={{ color: darkMode ? 'white' : 'black' }}>Company Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter company email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label style={{ color: darkMode ? 'white' : 'black' }}>Company</Form.Label>
                  <Form.Select
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  >
                    <option value="">Select Company</option>
                    <option value="MSI">MSI</option>
                    <option value="BAC">BAC</option>
                    <option value="Ari Walsh">Ari Walsh</option>
                    <option value="Confirmify">Confirmify</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label style={{ color: darkMode ? 'white' : 'black' }}>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                 />
                </Form.Group>
                <Form.Group className="mb-4">
                  <Form.Label style={{ color: darkMode ? 'white' : 'black' }}>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </Form.Group>
                <div className="d-grid gap-2">
                  <Button variant="primary" type="submit">
                    Create Account
                  </Button>
                  <Button
                    variant="outline-secondary"
                    type="button"
                    onClick={() => setShowRegister(false)}
                    className="mt-2"
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Dark Mode Toggle Button */}
      <div className="text-center my-4">
        <Button
          variant={darkMode ? 'light' : 'outline-dark'}
          onClick={() => {
            const newDarkMode = !darkMode;
            setDarkMode(newDarkMode);
            localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
            document.body.classList.toggle('dark-mode', newDarkMode);
          }}
          className="rounded-pill px-3 py-2"
        >
          {darkMode ? <Sun /> : <Moon />} {darkMode ? 'Light Mode' : 'Dark Mode'}
        </Button>
      </div>

      {/* Responsive Style */}
      <style>
  {`
    @media (max-width: 600px) {
      .top-logos img {
        height: 50px !important;
        max-width: 80px !important;
      }
      .top-logos span {
        font-size: 18px !important;
      }

      /* NEW mobile tweaks */
      .top-logos {
        padding-top: 100px !important;
      }
      .container > .card {
        margin-top: 1rem !important;
      }
    }
    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `}
</style>

    </div>
  );
}

export default Login;
