import React, { useState, useEffect } from 'react';
import { Button, Modal, Table, Form } from 'react-bootstrap';
import { useTickets } from './TicketContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Moon, Sun, EyeFill } from 'react-bootstrap-icons';

const admins = ["Dan", "Zay", "Emily"];
const statuses = ["Open", "In Progress", "Resolved"];
const priorities = ["Low", "Medium", "High"];

function AdminPanel({ role }) {
  const { tickets, setTickets, archivedTickets, setArchivedTickets } = useTickets();
  const navigate = useNavigate();
  const location = useLocation();

  // Filter state
  const [filterStatus,   setFilterStatus]   = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterUser,     setFilterUser]     = useState("");

  // Combine all into one list
  const allTickets = [
    ...(tickets.open        || []),
    ...(tickets["in progress"] || []),
    ...(tickets.resolved    || [])
  ];

  // Apply filters
  const filteredTickets = allTickets.filter(t =>
    (!filterStatus   || t.status      === filterStatus)   &&
    (!filterPriority || t.priority    === filterPriority) &&
    (!filterUser     || t.submittedBy === filterUser)
  );

  // Dark mode toggle
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  // Selection, modal state, etc.
  const [selectedIds, setSelectedIds] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const toggleSelect = id =>
    setSelectedIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);

  const handleChange = (id, field, value) => {
    setTickets(old => {
      const updated = { ...old };
      for (let key of Object.keys(updated)) {
        updated[key] = updated[key].map(t =>
          t.id === id ? { ...t, [field]: value } : t
        );
      }
      return updated;
    });
  };

  const uniqueUsers = [...new Set(allTickets.map(t => t.submittedBy))];

  return (
    <div className={`${darkMode ? 'bg-dark text-white' : 'bg-light text-dark'} min-vh-100`}>
      <div className="container-fluid px-4 py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="fw-bold mb-0">Admin Panel</h1>
          <div className="d-flex gap-2">
  <Button variant="primary" onClick={() => setShowSubmitModal(true)}>
    ＋ Submit Ticket
  </Button>
  {role === 'manager' && (
    <Button variant="warning" onClick={() => navigate('/admin')}>
      🔍 View Admin Panel
    </Button>
  )}
  <Button
    variant={darkMode ? 'light' : 'dark'}
    onClick={() => {
      const isDark = document.body.classList.contains('dark-mode');
      document.body.classList.toggle('dark-mode', !isDark);
      localStorage.setItem('darkMode', JSON.stringify(!isDark));
      setDarkMode(!isDark);
    }}
  >
    {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
  </Button>
  <Button
  variant="outline-danger"
  onClick={() => {
    // 1️⃣ Clear auth flags
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('role');
    // 2️⃣ Reset splash so it plays on next /login load
    // 3️⃣ Full reload to login screen
    window.location.href = '/login';
  }}
>
  🔒 Logout
</Button>
</div>
        </div>

        {/* Filters */}
        <div className="row mb-3">
          <div className="col-md-3">
            <Form.Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {statuses.map(s => <option key={s}>{s}</option>)}
            </Form.Select>
          </div>
          <div className="col-md-3">
            <Form.Select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="">All Priorities</option>
              {priorities.map(p => <option key={p}>{p}</option>)}
            </Form.Select>
          </div>
          <div className="col-md-3">
            <Form.Select value={filterUser} onChange={e => setFilterUser(e.target.value)}>
              <option value="">All Users</option>
              {uniqueUsers.map(u => <option key={u}>{u}</option>)}
            </Form.Select>
          </div>
          <div className="col-md-3 d-flex align-items-center">
            <Form.Check
              type="switch"
              id="archived-switch"
              label="Show Archived"
              checked={showArchived}
              onChange={() => setShowArchived(a => !a)}
            />
          </div>
        </div>

        {/* Table */}
        <Table striped bordered hover responsive variant={darkMode ? "dark" : "light"}>
          <thead>
            <tr>
              <th><Form.Check type="checkbox" disabled /></th>
              <th>Subject</th>
              <th>Description</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Submitted By</th>
              <th>Assigned To</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(showArchived ? archivedTickets : filteredTickets).map(t => (
              <tr key={t.id}>
                <td>
                  <Form.Check
                    type="checkbox"
                    checked={selectedIds.includes(t.id)}
                    onChange={() => toggleSelect(t.id)}
                    disabled={role === 'manager'}
                  />
                </td>
                <td>{t.title}</td>
                <td>{t.description}</td>
                {/* Status with color */}
                <td>
                  <Form.Select
                    value={t.status}
                    onChange={e => handleChange(t.id, 'status', e.target.value)}
                    disabled={role === 'manager'}
                    className={`text-white ${
                      t.status === 'Open'
                        ? 'bg-primary'
                        : t.status === 'In Progress'
                          ? 'bg-warning text-dark'
                          : 'bg-success'
                    }`}
                  >
                    {statuses.map(s => <option key={s}>{s}</option>)}
                  </Form.Select>
                </td>
                {/* Priority with color */}
                <td>
                  <Form.Select
                    value={t.priority}
                    onChange={e => handleChange(t.id, 'priority', e.target.value)}
                    disabled={role === 'manager'}
                    className={`text-white ${
                      t.priority === 'High'
                        ? 'bg-danger'
                        : t.priority === 'Medium'
                          ? 'bg-warning text-dark'
                          : 'bg-secondary'
                    }`}
                  >
                    {priorities.map(p => <option key={p}>{p}</option>)}
                  </Form.Select>
                </td>
                <td>{t.submittedBy}</td>
                <td>
                  <Form.Select
                    value={t.assignedTo || ''}
                    onChange={e => handleChange(t.id, 'assignedTo', e.target.value)}
                    disabled={role === 'manager'}
                  >
                    <option value="">Unassigned</option>
                    {admins.map(a => <option key={a}>{a}</option>)}
                  </Form.Select>
                </td>
                <td>{new Date(t.created_at).toLocaleString()}</td>
                <td>
                  <Button
                    size="sm"
                    variant={darkMode ? "light" : "outline-primary"}
                    onClick={() => { setSelectedTicket(t); setShowModal(true); }}
                  >
                    <EyeFill />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        {/* View Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>View Ticket</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedTicket && (
              <>
                <p><strong>Subject:</strong> {selectedTicket.title}</p>
                <p><strong>Description:</strong> {selectedTicket.description}</p>
                <p><strong>Status:</strong> {selectedTicket.status}</p>
                <p><strong>Priority:</strong> {selectedTicket.priority}</p>
                <p><strong>Submitted By:</strong> {selectedTicket.submittedBy}</p>
                <p><strong>Assigned To:</strong> {selectedTicket.assignedTo || 'Unassigned'}</p>
                <p><strong>Created At:</strong> {new Date(selectedTicket.created_at).toLocaleString()}</p>
                {selectedTicket.screenshot && (
                  <>
                    <p><strong>Screenshot:</strong></p>
                    <img src={selectedTicket.screenshot} alt="" className="img-fluid rounded" />
                  </>
                )}
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
}

export default AdminPanel;
