// AdminDashboard.jsx
import './index.css';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useTickets } from './TicketContext';
import { Card, Row, Col, Modal, Form, Badge, Button } from 'react-bootstrap';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { useNavigate } from 'react-router-dom';
import StatsCards from './components/StatsCards';
import StatusPie from './components/StatusPie';
import ToDoList from './components/ToDoList';

const API_BASE = "https://ticketing-api-z0gp.onrender.com";


ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

function AdminDashboard({ setIsAuthenticated }) {
  const navigate = useNavigate();

  /* 🔥 NEW – live ticket counts */
  const { tickets } = useTickets();
  const openCount = tickets.open.filter(t => !t.archived).length;
  const inProgressCount = tickets['in progress'].filter(t => !t.archived).length;
  const resolvedCount = tickets.resolved.filter(t => !t.archived).length;

  // ← for Corp Register modal:
  const [showCorpModal, setShowCorpModal] = useState(false);
  const [corpFirstName, setCorpFirstName] = useState('');
  const [corpLastName, setCorpLastName] = useState('');
  const [corpEmail, setCorpEmail] = useState('');
  const [corpRole, setCorpRole] = useState('User');
  const [corpPassword, setCorpPassword] = useState('');
  const [corpCompany, setCorpCompany] = useState('MSI Staff')


  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('darkMode');
    return stored
      ? JSON.parse(stored)
      : document.body.classList.contains('dark-mode');
  });

  useEffect(() => {
    const obs = new MutationObserver(() =>
      setDarkMode(document.body.classList.contains('dark-mode'))
    );
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const toggleDarkMode = () => {
    const isDark = document.body.classList.contains('dark-mode');
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', JSON.stringify(!isDark));
    setDarkMode(!isDark);
  };

  const handleCorpRegister = async () => {
    try {
      await axios.post(`${API_BASE}/register`, {
          first_name: corpFirstName,
          last_name: corpLastName,
          email: corpEmail,
          company: corpCompany,
          role: corpRole,               // your backend must accept this
          password: corpPassword
        }
      );
      // clear & close
      setCorpFirstName('');
      setCorpLastName('');
      setCorpEmail('');
      setCorpRole('User');
      setCorpPassword('');
      setShowCorpModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const pieData = {
    labels: ['Open', 'In Progress', 'Resolved'],
    datasets: [
      {
        data: [openCount, inProgressCount, resolvedCount],
        backgroundColor: ['#3B82F6', '#EAB308', '#22C55E']
      }
    ]
  };
  const pieOptions = {
    plugins: {
      datalabels: {
        color: '#fff',
        formatter: (value, ctx) =>
          `${(
            (value /
              ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0)) *
            100
          ).toFixed(1)}%`
      },
      legend: {
        position: 'bottom',
        labels: {
          color: darkMode ? '#fff' : '#000',
          font: { size: 14 },
          padding: 15
        }
      }
    }
  };

  // ... your existing task/list states & handlers here (unchanged) ...

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold d-flex align-items-center">
          <img
            src="https://cdn-icons-png.flaticon.com/512/1828/1828919.png"
            width="32"
            height="32"
            className={`me-2 float-logo ${darkMode ? 'invert-icon' : ''}`}
            alt="icon"
          />
          Admin Insights Dashboard
        </h2>
        <div className="d-flex gap-2">
          <Button
            variant="outline-secondary"
            onClick={() => navigate('/admin')}
            className="d-flex align-items-center gap-2"
          >
            🛠 Admin Panel
          </Button>

          {/* ← Corp Register button */}
          <Button
            variant="outline-info"
            onClick={() => setShowCorpModal(true)}
            className="d-flex align-items-center gap-2"
          >
            Corp Register
          </Button>

          <Button
            variant={darkMode ? 'light' : 'dark'}
            onClick={toggleDarkMode}
            className="d-flex align-items-center gap-2"
          >
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </Button>
          <Button
            variant="outline-danger"
            onClick={() => {
              localStorage.removeItem('isAuthenticated');
              setIsAuthenticated(false);
              navigate('/login');
            }}
          >
            🔒 Logout
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsCards
        openCount={openCount}
        inProgressCount={inProgressCount}
        resolvedCount={resolvedCount}
      />

      {/* Chart & List */}
      <Row>
        <Col xs={12} md={6} className="mb-4">
          <StatusPie data={pieData} options={pieOptions} />
        </Col>
        <Col xs={12} md={6} className="mb-4">
          <ToDoList
            /* …all your existing ToDoList props… */
          />
        </Col>
      </Row>

      {/* ← Corp Register Modal */}
      <Modal
        show={showCorpModal}
        onHide={() => setShowCorpModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Corporate Register</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>First Name</Form.Label>
            <Form.Control
              value={corpFirstName}
              onChange={e => setCorpFirstName(e.target.value)}
              placeholder="First Name"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Last Name</Form.Label>
            <Form.Control
              value={corpLastName}
              onChange={e => setCorpLastName(e.target.value)}
              placeholder="Last Name"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={corpEmail}
              onChange={e => setCorpEmail(e.target.value)}
              placeholder="Email"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Role</Form.Label>
            <Form.Select
              value={corpRole}
              onChange={e => setCorpRole(e.target.value)}
            >
              <option>User</option>
              <option>Admin</option>
              <option>Manager</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Company</Form.Label>
            <Form.Control
              value={corpCompany}
              onChange={e => setCorpCompany(e.target.value)}
              placeholder="MSI Staff"
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              value={corpPassword}
              onChange={e => setCorpPassword(e.target.value)}
              placeholder="Temporary Password"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowCorpModal(false)}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCorpRegister}>
            Register
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ← your existing Task modal stays here, unchanged */}
    </div>
  );
}

export default AdminDashboard;
