import React, { useState, useEffect } from 'react';
import { Form, Table, Modal, Button, Row, Col, Badge } from 'react-bootstrap';
import { useTickets } from './TicketContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Moon, Sun, EyeFill } from 'react-bootstrap-icons';
import axios from 'axios';

const API_BASE = "https://ticketing-api-z0gp.onrender.com";


const statuses   = ["Open", "In Progress", "Resolved", "Closed"];
const priorities = ["Low", "Medium", "High"];

export default function AdminPanel({ role }) {
  const {
    tickets,
    setTickets,
    archivedTickets,
    setArchivedTickets,
    updateTicket,
  } = useTickets();

  const [allTickets,      setAllTickets]      = useState([]);
  const [adminUsers,      setAdminUsers]      = useState([]);
  const [showModal,       setShowModal]       = useState(false);
  const [selectedTicket,  setSelectedTicket]  = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState("");

  

  // Filter state
  const [filterStatus,   setFilterStatus]   = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterUser,     setFilterUser]     = useState("");
  const [filterLocation, setFilterLocation] = useState("");


  const navigate = useNavigate();
  const location = useLocation();

  const [showArchived, setShowArchived] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [completedTickets, setCompletedTickets] = useState([]);
  

  // Fetch tickets (active vs archived)
  useEffect(() => {
    if (role === 'admin' || role === 'manager') {
      axios
        .get(`${API_BASE}/tickets?archived=${showArchived}`)
        .then(resp => {
          const mapped = resp.data.map(t => ({
            ...t,
            assignedTo: t.assigned_to
          }));
          setAllTickets(mapped);
        })
        .catch(console.error);
    }
  }, [role, showArchived]);

  // ② fetch admins (runs once on mount—but we’ll also call it after corp-register)
  const fetchAdmins = () => {
    axios
      .get(`${API_BASE}/users?role=Admin`)
      .then(r => setAdminUsers(r.data))
      .catch(console.error);
  };

  useEffect(fetchAdmins, []);

  async function handleCorpRegister() {
    await axios.post(`${API_BASE}/register`, {
      first_name: corpFirstName,
      last_name:  corpLastName,
      email:      corpEmail,
      company:    corpCompany,
      role:       corpRole,
      password:   corpPassword,
    });
    // re-load the admin list
    fetchAdmins();
    // … clear form & close modal …
  }

  async function archiveTicket(ticket) {
    // mark archived on the server
    await updateTicket(ticket.id, { status: "Closed", archived: true });
  
    // update local list
    setAllTickets(prev =>
      prev.map(x =>
        x.id === ticket.id
          ? { ...x, status: "Closed", archived: true }
          : x
      )
    );
  
    // move into your completedTickets array (if you’re still using it)
    setCompletedTickets(prev => {
      const without = prev.filter(t => t.id !== ticket.id);
      return [{ ...ticket, status: "Closed", archived: true }, ...without];
    });
  }
  

  async function resolveTicket(ticket) {
    await updateTicket(ticket.id, { status: "Resolved", response: responseText });
  
    // ✅ Update in place
    setAllTickets(prev =>
      prev.map(x => x.id === ticket.id ? { ...x, status: "Resolved", response: responseText } : x)
    );
  
    // ✅ Move the ticket to completedTickets instantly
    setCompletedTickets(prev => {
      const without = prev.filter(t => t.id !== ticket.id);
      return [{ ...ticket, status: "Resolved", response: responseText }, ...without];
    });
  
    setResponseText(""); // Clear input
  }



  // Fetch admin users
  useEffect(() => {
  axios
    .get(`${API_BASE}/users?role=Admin`)
    .then(r => setAdminUsers(r.data))
    .catch(console.error);
}, []);

  const handleStatusChange = (t, newStatus) => {
    // 🔄 If completed view and reopened, go back to main view
    if (showCompleted && newStatus === "Open") {
      setShowCompleted(false);
    }
  
    updateTicket(t.id, { status: newStatus });
  
    // 1️⃣ Update the main ticket list
    setAllTickets(prev =>
      prev.map(x => x.id === t.id ? { ...x, status: newStatus } : x)
    );
  
    // 2️⃣ If the ticket is "Resolved" or "Closed," add it to completedTickets
    // Otherwise, remove it from completedTickets
    setCompletedTickets(prev =>
      (newStatus === "Resolved" || newStatus === "Closed")
        ? [...prev.filter(x => x.id !== t.id), { ...t, status: newStatus }]
        : prev.filter(x => x.id !== t.id)
    );
  };
  
  
  
  const handlePriorityChange = (t, newPriority) => {
    updateTicket(t.id, { priority: newPriority });
    setAllTickets(prev =>
      prev.map(x => x.id === t.id ? { ...x, priority: newPriority } : x)
    );
  };
  const handleAssignChange = (t, newAssignee) => {
    updateTicket(t.id, { assigned_to: newAssignee });
    setAllTickets(prev =>
      prev.map(x => x.id === t.id ? { ...x, assignedTo: newAssignee } : x)
    );
  };

  console.log(
    '🔍 showArchived:', showArchived,
    'tickets:', allTickets.map(t => ({
      id: t.id,
      status: t.status,
      archived: t.archived
    }))
  );
  

  const filteredTickets = allTickets.filter(t => {
      // 🔍 Location filter: if one is entered but this ticket’s location doesn’t match, skip
  if (filterLocation && t.location !== filterLocation) {
    return false;
  }
    // 1️⃣ If “Show Archived” is active, only show archived tickets
    if (showArchived) {
      return t.archived === true;
    }
    // 2️⃣ Else if “Show Completed” is active, only show resolved/closed
    if (showCompleted) {
      return t.status === "Resolved" || t.status === "Closed";
    }
    // 3️⃣ Otherwise (default), only show open or in-progress
    return t.status === "Open" || t.status === "In Progress";
  });
  
  
  

  const uniqueUsers = [...new Set(allTickets.map(t => t.submitted_by))];

  // now build your list of locations
   const uniqueLocations = [
   ...new Set(
     allTickets
       .map(t => t.location)      // pull out the `location` field
       .filter(loc => loc && loc.trim() !== "")  // drop empty/null
   )
 ];

 

  // Dark mode
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('darkMode') === 'true'
  );
  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  // Selection checkboxes
  const [selectedIds, setSelectedIds] = useState([]);
  const toggleSelect = id =>
    setSelectedIds(ids =>
      ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]
    );

  return (
    <div className={`${darkMode ? 'bg-dark text-white' : 'bg-light text-dark'} min-vh-100`}>
      <div className="container-fluid px-4 py-5">
        {/* header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="fw-bold mb-0">Admin Panel</h1>
          <div className="d-flex gap-2">
            {role === 'admin' && location.pathname !== '/dashboard' && (
              <Button variant="outline-primary" onClick={() => navigate('/dashboard')}>
                📊 Dashboard
              </Button>
            )}
            {role === 'manager' && (
              <Button variant="warning" onClick={() => navigate('/')}>
                🔙 Back to My Tickets
              </Button>
            )}
            <Button
              variant={darkMode ? 'light' : 'dark'}
              onClick={() => {
                const next = !darkMode;
                setDarkMode(next);
                localStorage.setItem('darkMode', JSON.stringify(next));
              }}
            >
              {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </Button>
            <Button
              variant="outline-danger"
              onClick={() => {
                localStorage.removeItem('isAuthenticated');
                localStorage.removeItem('role');
                window.location.href = '/login';
              }}
            >
              🔒 Logout
            </Button>
          </div>
        </div>

        {/* filters */}
<Row className="mb-4 gx-3">
  <Col md={2}>
    <Form.Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
      <option value="">All Statuses</option>
      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
    </Form.Select>
  </Col>
  <Col md={2}>
    <Form.Select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
      <option value="">All Priorities</option>
      {priorities.map(p => <option key={p} value={p}>{p}</option>)}
    </Form.Select>
  </Col>
  <Col md={2}>
    <Form.Control
      type="text"
      list="user-list"
      value={filterUser}
      onChange={e => setFilterUser(e.target.value)}
      placeholder="Search users..."
    />
    <datalist id="user-list">
      {uniqueUsers.map(u => <option key={u} value={u} />)}
    </datalist>
  </Col>
  {/* Location filter */}
  <Col md={2}>
    <Form.Control
      type="text"
      list="location-list"
      value={filterLocation}
      onChange={e => setFilterLocation(e.target.value)}
      placeholder="Filter by location…"
    />
    <datalist id="location-list">
      {uniqueLocations.map(loc => (
        <option key={loc} value={loc} />
      ))}
    </datalist>
  </Col>
  <Col md={4} className="d-flex justify-content-end gap-2">
    <Button
      onClick={() => setShowCompleted(v => !v)}
      variant={showCompleted ? 'secondary' : 'outline-secondary'}
    >
      {showCompleted ? 'Hide Completed' : 'Show Completed'}
    </Button>
    <Button
      onClick={() => setShowArchived(v => !v)}
      variant={showArchived ? 'secondary' : 'outline-secondary'}
    >
      {showArchived ? 'Hide Archived' : 'Show Archived'}
    </Button>
  </Col>
</Row>


        {/* table */}
        <Table striped bordered hover responsive variant={darkMode ? "dark" : "light"}>
          <thead>
            <tr>
              <th><Form.Check type="checkbox" disabled /></th>
              <th>Subject</th>
              <th>Description</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Submitted By</th>
              <th>Location</th>
              <th>Assigned To</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map(t => (
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
                <td>
                  {t.archived ? (
                    <Badge bg="secondary">Canceled</Badge>
                  ) : (
                  <Form.Select
                    value={t.status}
                    onChange={e => handleStatusChange(t, e.target.value)}
                    disabled={role === 'manager'}
                    className={`text-white ${
                      t.status === 'Open'
                        ? 'bg-primary border-3 border-info shadow-sm'
                        : t.status === 'In Progress'
                          ? 'bg-warning text-dark'
                          : 'bg-success'
                    }`}
                    
                  >
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </Form.Select>
                 )} 
                </td>
                <td>
                  <Form.Select
                    value={t.priority}
                    onChange={e => handlePriorityChange(t, e.target.value)}
                    disabled={role === 'manager'}
                    className={`text-white ${
                      t.priority === 'High'
                        ? 'bg-danger'
                        : t.priority === 'Medium'
                          ? 'bg-warning text-dark'
                          : 'bg-secondary'
                    }`}
                  >
                    {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                  </Form.Select>
                </td>
                <td>{t.submitted_by}</td>
                <td>{t.location || '—'}</td>
                <td>
                  <Form.Select
                    value={t.assignedTo || ''}
                    onChange={e => handleAssignChange(t, e.target.value)}
                    disabled={role === 'manager'}
                  >
                    <option value="">Unassigned</option>
                    {adminUsers.map(u => (
                      <option key={u.email} value={u.email}>
                        {u.first_name} {u.last_name}
                      </option>
                    ))}
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
                  <Button
  size="sm"
  variant="outline-secondary"
  onClick={() => {
    setSelectedTicket(t);
    setShowResponseModal(true);
  }}
  className="ms-2"
>
  💬 Respond
</Button>

                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        {/* view modal */}
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
                <p><strong>Submitted By:</strong> {selectedTicket.submitted_by}</p>
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

{/* Response Modal */}
<Modal
  show={showResponseModal}
  onHide={() => setShowResponseModal(false)}
  centered
>
  <Modal.Header closeButton>
    <Modal.Title>Respond to Ticket</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <Form.Group>
      <Form.Label>Your Response</Form.Label>
      <Form.Control
        as="textarea"
        rows={4}
        value={responseText}
        onChange={e => setResponseText(e.target.value)}
      />
    </Form.Group>
  </Modal.Body>
 <Modal.Footer>
 <Button
  variant="success"
  onClick={async () => {
    await resolveTicket(selectedTicket);
    setShowResponseModal(false);
  }}
>
  Resolve Ticket
</Button>

  <Button
  variant="danger"
  onClick={async () => {
    console.log("Close clicked:", selectedTicket?.id);
    await archiveTicket(selectedTicket);
    setShowResponseModal(false);
  }}
>
  Close Ticket
</Button>

  <Button variant="secondary" className="ms-2" onClick={() => setShowResponseModal(false)}>
    Cancel
  </Button>
</Modal.Footer>

</Modal>

      </div>
    </div>
  );
}
