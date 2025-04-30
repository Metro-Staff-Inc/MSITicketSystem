import './index.css';
import React, { useState, useEffect } from 'react';
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

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

function AdminDashboard({ setIsAuthenticated }) {
  const navigate = useNavigate();

  const ticketStats = {
    open: 12,
    inProgress: 8,
    resolved: 20,
  };

  const [darkMode, setDarkMode] = useState(() => {
    const storedMode = localStorage.getItem('darkMode');
    return storedMode ? JSON.parse(storedMode) : document.body.classList.contains('dark-mode');
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.body.classList.contains('dark-mode');
      setDarkMode(isDark);
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

    return () => observer.disconnect();
  }, []);

  const toggleDarkMode = () => {
    const isDark = document.body.classList.contains('dark-mode');
    if (isDark) {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('darkMode', JSON.stringify(false));
      setDarkMode(false);
    } else {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', JSON.stringify(true));
      setDarkMode(true);
    }
  };

  const pieData = {
    labels: ['Open', 'In Progress', 'Resolved'],
    datasets: [
      {
        data: [ticketStats.open, ticketStats.inProgress, ticketStats.resolved],
        backgroundColor: ['#3B82F6', '#EAB308', '#22C55E'],
      },
    ],
  };

  const pieOptions = {
    plugins: {
      datalabels: {
        color: '#fff',
        formatter: (value, ctx) => {
          const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
          return `${((value / total) * 100).toFixed(1)}%`;
        },
      },
      legend: {
        position: 'bottom',
        labels: {
          color: darkMode ? '#fff' : '#000',
          font: { size: 14 },
          padding: 15,
        },
      },
    },
  };

  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [filter, setFilter] = useState('All');
  const [editingIndex, setEditingIndex] = useState(null);
  const [screenshot, setScreenshot] = useState(null);

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    const updatedTasks = [...tasks];
    const taskData = {
      text: newTask,
      completed: false,
      priority,
      assignedTo,
      screenshot,
    };

    if (editingIndex !== null) {
      updatedTasks[editingIndex] = taskData;
      setEditingIndex(null);
    } else {
      updatedTasks.push(taskData);
    }

    setTasks(updatedTasks);
    setNewTask('');
    setPriority('Medium');
    setAssignedTo('');
    setScreenshot(null);
    setShowModal(false);
  };

  const handleToggleTask = (index) => {
    const updated = [...tasks];
    updated[index].completed = !updated[index].completed;
    setTasks(updated);
  };

  const handleDeleteTask = (index) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleEditTask = (index) => {
    const task = tasks[index];
    setNewTask(task.text);
    setPriority(task.priority);
    setAssignedTo(task.assignedTo);
    setScreenshot(task.screenshot);
    setEditingIndex(index);
    setShowModal(true);
  };

  const filteredTasks = tasks.filter((task) =>
    filter === 'All' || task.priority === filter
  );

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold d-flex align-items-center">
          <img
            src="https://cdn-icons-png.flaticon.com/512/1828/1828919.png"
            alt="icon"
            width="32"
            height="32"
            className={`me-2 float-logo ${darkMode ? 'invert-icon' : ''}`}
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

          <Button
            variant={darkMode ? "light" : "dark"}
            onClick={toggleDarkMode}
            className="d-flex align-items-center gap-2"
          >
            {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </Button>

          <Button
            variant="outline-danger"
            onClick={() => {
              localStorage.removeItem('isAuthenticated');
              if (setIsAuthenticated) setIsAuthenticated(false);
              navigate('/login');
            }}
          >
            🔒 Logout
          </Button>
        </div>
      </div>

      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-white bg-primary shadow-sm border-0">
            <Card.Body>
              <Card.Title>Open Tickets</Card.Title>
              <h3>{ticketStats.open}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-dark bg-warning shadow-sm border-0">
            <Card.Body>
              <Card.Title>In Progress</Card.Title>
              <h3>{ticketStats.inProgress}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-white bg-success shadow-sm border-0">
            <Card.Body>
              <Card.Title>Resolved Tickets</Card.Title>
              <h3>{ticketStats.resolved}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={6} className="mb-4">
          <Card className="p-3 shadow-sm h-100">
            <Card.Title className="mb-3">Tickets by Status</Card.Title>
            <Pie data={pieData} options={pieOptions} />
          </Card>
        </Col>

        <Col md={6} className="mb-4">
          <Card className="p-3 shadow-sm h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Card.Title className="mb-0">📝 Team To-Do List</Card.Title>
              <Button size="sm" onClick={() => setShowModal(true)}>+ Add</Button>
            </div>

            <Form.Select
              className="mb-3"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option>All</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </Form.Select>

            {filteredTasks.map((task, index) => (
              <Card
                key={index}
                className={`mb-2 p-2 shadow-sm ${task.completed ? 'opacity-75' : ''}`}
              >
                <div className="d-flex align-items-center justify-content-between">
                  <Form.Check
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleTask(index)}
                    label={
                      <span className={`ms-2 ${task.completed ? 'text-decoration-line-through text-muted' : ''}`}>
                        {task.text}
                      </span>
                    }
                  />
                  <div className="d-flex gap-2">
                    <Badge bg={
                      task.priority === 'High' ? 'danger' :
                      task.priority === 'Medium' ? 'warning' : 'secondary'
                    }>
                      {task.priority}
                    </Badge>
                    {task.screenshot && (
                      <a href={URL.createObjectURL(task.screenshot)} target="_blank" rel="noreferrer">📌</a>
                    )}
                    <Button variant="outline-primary" size="sm" onClick={() => handleEditTask(index)}>✎</Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDeleteTask(index)}>✕</Button>
                  </div>
                </div>
                {task.assignedTo && <div className="ms-4 text-muted">👤 {task.assignedTo}</div>}
              </Card>
            ))}
          </Card>
        </Col>
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingIndex !== null ? 'Edit Task' : 'Add New Task'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Task</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter task"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Priority</Form.Label>
            <Form.Select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Assign To</Form.Label>
            <Form.Control
              type="text"
              placeholder="Name"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Upload Screenshot (optional)</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={(e) => setScreenshot(e.target.files[0])}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={handleAddTask}>{editingIndex !== null ? 'Update Task' : 'Add Task'}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default AdminDashboard;
