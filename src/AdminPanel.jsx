import React, { useState, useEffect } from 'react';
import { Button, Modal, Table, Form } from 'react-bootstrap';
import {
  Moon, Sun, EyeFill, ArrowClockwise
} from 'react-bootstrap-icons';
import { useTickets } from './TicketContext';
import { useNavigate, useLocation } from 'react-router-dom';

const admins = ["Dan", "Zay", "Emily"];
const statuses = ["Open", "In Progress", "Resolved"];
const priorities = ["Low", "Medium", "High"];

function AdminPanel({ role }) {
  const { tickets, setTickets, archivedTickets, setArchivedTickets } = useTickets();
  const allTickets = [
    ...(tickets.open || []),
    ...(tickets["in progress"] || []),
    ...(tickets.resolved || [])
  ];
  
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);
  
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showArchived, setShowArchived] = useState(false);

  const activeFiltered = tickets.filter(t =>
    (!filterStatus || t.status === filterStatus) &&
    (!filterPriority || t.priority === filterPriority) &&
    (!filterUser || t.submittedBy === filterUser)
  );

  const archivedFiltered = archivedTickets.filter(t =>
    (!filterStatus || t.status === filterStatus) &&
    (!filterPriority || t.priority === filterPriority) &&
    (!filterUser || t.submittedBy === filterUser)
  );

  const filteredTickets = showArchived ? archivedFiltered : activeFiltered;

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleChange = (id, field, value) => {
    setTickets(prev =>
      prev.map(ticket => ticket.id === id ? { ...ticket, [field]: value } : ticket)
    );
  };

  const uniqueUsers = [...new Set(tickets.map(t => t.submittedBy))];

  return (
    <div className={`${darkMode ? 'bg-dark text-white' : 'bg-light text-dark'} min-vh-100`}>
         <div className="container-fluid px-4 py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="fw-bold mb-0">Admin Panel</h1>

          <div className="d-flex gap-2">
            {location.pathname !== '/dashboard' && (
              <Button
                variant="outline-primary"
                onClick={() => navigate('/dashboard')}
                className="d-flex align-items-center gap-2"
              >
                📊 Dashboard
              </Button>
            )}

            {location.pathname !== '/admin' && (
              <Button
                variant="outline-secondary"
                onClick={() => navigate('/admin')}
                className="d-flex align-items-center gap-2"
              >
                🛠 Admin Panel
              </Button>
            )}

            <Button
              variant={darkMode ? "outline-light" : "outline-dark"}
              onClick={() => setDarkMode(!darkMode)}
              className="d-flex align-items-center gap-2"
            >
              {darkMode ? <Sun className="me-1" /> : <Moon className="me-1" />}
              {darkMode ? "Light Mode" : "Dark Mode"}
            </Button>
  {/* Manager-only “Back” button */}
  {role === 'manager' && (
  <Button
  variant="secondary"
onClick={() => navigate('/')}
className="d-flex align-items-center gap-2"
>
← Back to My Tickets
</Button>
)}

            <Button
              variant="outline-danger"
              onClick={() => {
                localStorage.removeItem('isAuthenticated');
                navigate('/login');
              }}
              className="d-flex align-items-center gap-2"
            >
              🔒 Logout
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="row mb-3 filter-row">
          <div className="col-md-3">
            <Form.Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Filter by Status</option>
              {statuses.map(s => <option key={s}>{s}</option>)}
            </Form.Select>
          </div>
          <div className="col-md-3">
            <Form.Select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="">Filter by Priority</option>
              {priorities.map(p => <option key={p}>{p}</option>)}
            </Form.Select>
          </div>
          <div className="col-md-3">
            <Form.Select value={filterUser} onChange={e => setFilterUser(e.target.value)}>
              <option value="">Filter by User</option>
              {uniqueUsers.map(user => <option key={user}>{user}</option>)}
            </Form.Select>
          </div>
          <div className="col-md-3 d-flex align-items-center">
            <Form.Check
              type="switch"
              id="archived-switch"
              label="Show Archived"
              checked={showArchived}
              onChange={() => setShowArchived(!showArchived)}
            />
          </div>
        </div>

        {/* Table */}
        <Table striped bordered hover responsive variant={darkMode ? "dark" : "light"}>
          <thead>
            <tr>
              <th><Form.Check type="checkbox" disabled /></th>
              <th>Subject</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Submitted By</th>
              <th>Assigned To</th>
              <th>Submitted At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allTickets.map((ticket) => (
              <tr key={ticket.id}>
                <td>
                  <Form.Check
                    type="checkbox"
                    checked={selectedIds.includes(ticket.id)}
                    onChange={() => toggleSelect(ticket.id)}
                    disabled={role === 'manager'}
                  />
                </td>
                <td>{ticket.subject}</td>
                <td>
                <Form.Select
  value={ticket.status}
  onChange={e => handleChange(ticket.id, "status", e.target.value)}
  disabled={role === 'manager'}
  className={`text-white ${
    ticket.status === "Open" ? "bg-primary"
      : ticket.status === "In Progress" ? "bg-warning text-dark"
        : "bg-success"
  }`}
>
  {statuses.map(s => <option key={s}>{s}</option>)}
</Form.Select>
                </td>
                <td>
                  <Form.Select
                    value={ticket.priority}
                    onChange={(e) => handleChange(ticket.id, "priority", e.target.value)}
                    disabled={role === 'manager'}
                    className={`text-white ${
                      ticket.priority === "High" ? "bg-danger"
                        : ticket.priority === "Medium" ? "bg-warning text-dark"
                          : "bg-secondary"
                    }`}
                  >
                    {priorities.map(p => <option key={p}>{p}</option>)}
                  </Form.Select>
                </td>
                <td>{ticket.submittedBy}</td>
                <td>
                  <Form.Select
                    value={ticket.assignedTo}
                    onChange={(e) => handleChange(ticket.id, "assignedTo", e.target.value)}
                    disabled={role === 'manager'}
                  >
                    <option value="">Unassigned</option>
                    {admins.map(admin => (
                      <option key={admin} value={admin}>{admin}</option>
                    ))}
                  </Form.Select>
                </td>
                <td>{ticket.created}</td>
                <td>
                  <Button
                    size="sm"
                    variant={darkMode ? "light" : "outline-primary"}
                    onClick={() => { setSelectedTicket(ticket); setShowModal(true); }}
                  >
                    <EyeFill /> View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        {/* Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton><Modal.Title>View Ticket</Modal.Title></Modal.Header>
          <Modal.Body>
            {selectedTicket && (
              <>
                <p><strong>Subject:</strong> {selectedTicket.subject}</p>
                <p><strong>Description:</strong> {selectedTicket.description}</p>
                <p><strong>Status:</strong> {selectedTicket.status}</p>
                <p><strong>Priority:</strong> {selectedTicket.priority}</p>
                <p><strong>Submitted By:</strong> {selectedTicket.submittedBy}</p>
                <p><strong>Assigned To:</strong> {selectedTicket.assignedTo || "Unassigned"}</p>
                <p><strong>Created:</strong> {selectedTicket.created}</p>
                {selectedTicket.screenshot && (
                  <>
                    <p><strong>Screenshot:</strong></p>
                    <img src={selectedTicket.screenshot} alt="screenshot" className="img-fluid rounded" />
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
