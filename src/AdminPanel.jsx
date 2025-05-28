import React, { useState, useEffect, useRef } from 'react';
import { Image, Card, ListGroup, Form, Table, Modal, Button, Row, Col, Badge } from 'react-bootstrap';
import { useTickets } from './TicketContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Moon, Sun, EyeFill } from 'react-bootstrap-icons';
import axios from 'axios';

const API_BASE = "https://ticketing-api-z0gp.onrender.com";

// Notification sound
const notificationSound = new Audio('/static/sounds/notification.mp3');



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

// For confirming an assignment
const [showAssignConfirm, setShowAssignConfirm] = useState(false);
const [pendingAssign, setPendingAssign] = useState({ ticket: null, user: '' });


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
  // — high‑priority confirmation —
  const [showHighModal,     setShowHighModal]     = useState(false); // popup flag
  const [pendingHighTicket, setPendingHighTicket] = useState(null);  // ticket object

  const prevCountRef = useRef(0);
  const socketRef = useRef(null);

  
  
  

  // Fetch tickets (active vs archived)
  useEffect(() => {
  if (role !== 'admin' && role !== 'manager') return;

  const loadTickets = async () => {
    try {
      const resp = await axios.get(`${API_BASE}/tickets?archived=${showArchived}`);
      const mapped = resp.data.map(t => ({
  ...t,
  assignedTo: t.assigned_to,
  submitted_first_name: t.submitted_first_name || t.submitted_by_first_name || "",
  submitted_last_name: t.submitted_last_name || t.submitted_by_last_name || "",
  customer_impacted: t.customer_impacted || false,
}));


      // Play sound if count increases
      if (prevCountRef.current > 0 && mapped.length > prevCountRef.current) {
        notificationSound.play().catch(() => {});
      }
      prevCountRef.current = mapped.length;

      setAllTickets(mapped);
    } catch (err) {
      console.error(err);
    }
  };

  // Initial load + poll every 15s
  loadTickets();
  const intervalId = setInterval(loadTickets, 15000);
  return () => clearInterval(intervalId);
}, [role, showArchived]);

useEffect(() => {
  // Open WebSocket connection
  const ws = new WebSocket('wss://ticketing-api-z0gp.onrender.com/ws/tickets');
  socketRef.current = ws;

  // When a new-ticket event arrives...
  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.event === 'new_ticket') {
        // Play the notification immediately
        notificationSound.play().catch(() => {});
        // Optionally prepend the new ticket to your list:
        setAllTickets(prev => [msg.data, ...prev]);
      }
    } catch (err) {
      console.error('WS parse error', err);
    }
  };

  // Clean up on unmount
  return () => ws.close();
}, []);  // run once on mount


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
  // If “High” was picked and the ticket wasn’t already High → open popup
  if (newPriority === 'High' && t.priority !== 'High') {
    setPendingHighTicket(t);     // remember which ticket we’re editing
    setShowHighModal(true);      // show confirmation modal
    return;                      // do NOT save yet
  }

  // Otherwise, just update immediately
  updateTicket(t.id, { priority: newPriority });
  setAllTickets(prev =>
    prev.map(x => x.id === t.id ? { ...x, priority: newPriority } : x)
  );
};

const handleConfirmAssign = async () => {
  // 1) Persist on the server
  await updateTicket(pendingAssign.ticket.id, { assigned_to: pendingAssign.user });
  // 2) Update local UI
  setAllTickets(prev =>
    prev.map(x =>
      x.id === pendingAssign.ticket.id
        ? { ...x, assignedTo: pendingAssign.user }
        : x
    )
  );
  // 3) Close the modal and clear pending state
  setShowAssignConfirm(false);
  setPendingAssign({ ticket: null, user: '' });
};


const handleAssignChange = async (ticket, newAssignee) => {
  try {
    // Persist the new assignee on the server
    await updateTicket(ticket.id, { assigned_to: newAssignee });
    // Update local state so the table refreshes
    setAllTickets(prev =>
      prev.map(x =>
        x.id === ticket.id ? { ...x, assignedTo: newAssignee } : x
      )
    );
  } catch (err) {
    console.error("Failed to assign ticket:", err);
  }
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
  // — 1. Status drop‑down —
  if (filterStatus && t.status !== filterStatus) {
    return false;
  }

  // — 2. Priority drop‑down —
  if (filterPriority && t.priority !== filterPriority) {
    return false;
  }

  // — 3. “Submitted By” search (case‑insensitive “contains”) —
  if (
  filterUser &&
  !(
    (t.submitted_by && t.submitted_by.toLowerCase().includes(filterUser.toLowerCase())) ||
    (t.submitted_by_name && t.submitted_by_name.toLowerCase().includes(filterUser.toLowerCase()))
  )
) {
  return false;
}


  // — 4. Location filter — NOW smart/contains
if (
  filterLocation &&                                           // something typed
  !(t.location || "").toLowerCase().includes(
      filterLocation.toLowerCase()
  )
) {
  return false;                                               // skip if no match
}


  // — 5. archived / completed toggles (keep your existing logic) —
  if (showArchived) {
    return t.archived === true;
  }
  if (showCompleted) {
    return t.status === "Resolved" || t.status === "Closed";
  }
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
  {statuses
    .filter(s => s === 'Open' || s === 'In Progress')
    .map(s => <option key={s} value={s}>{s}</option>)}
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
    <Form.Select
  value={filterLocation}
  onChange={e => setFilterLocation(e.target.value)}
>
  <option value="">All Locations</option>
  {[
    "Aurora",
    "Bartlett",
    "Bolingbrook",
    "Burbank",
    "Corporate",
    "Elgin",
    "Elk Grove",
    "Palatine",
    "Las Vegas",
    "Melrose Park",
    "On-Site",
    "West Chicago"
  ].map(loc => (
    <option key={loc} value={loc}>{loc}</option>
  ))}
</Form.Select>
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
        <Table striped bordered hover responsive variant={darkMode ? "dark" : "light"} className="table">
          <thead>
            <tr>
              <th><Form.Check type="checkbox" disabled /></th>
              <th>Subject</th>
              <th>Description</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Customer Impacted?</th>
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
      <td
        style={{
          maxWidth: '150px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
        title={t.description}
      >
        {t.description}
      </td>
      <td>
        <Form.Select
  size="sm"
  value={t.status}
  onChange={e => handleStatusChange(t, e.target.value)}
  disabled={role === 'manager'}
  className={
    t.status === 'Open'
      ? 'bg-primary text-white'
      : t.status === 'In Progress'
      ? 'bg-warning text-dark'
      : 'bg-secondary text-white'
  }
>
  {statuses
    .filter(s => s === 'Open' || s === 'In Progress') // 🧹 only include valid options
    .map(s => (
      <option key={s} value={s}>
        {s}
      </option>
    ))}
</Form.Select>
      </td>
      <td>
        <Form.Select
  size="sm"
  value={t.priority}
  onChange={e => handlePriorityChange(t, e.target.value)}
  disabled={role === 'manager'}
  className={
    t.priority === 'High'
      ? 'bg-danger text-white'
      : t.priority === 'Medium'
      ? 'bg-warning text-dark'
      : 'bg-secondary text-white'
  }
>
          {priorities.map(p => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Form.Select>
      </td>
      <td>{t.customer_impacted ? "Yes" : "No"}</td>
      <td>{t.submitted_by_name || t.submitted_by}</td>
      <td>{t.location || '—'}</td>
      <td>
  <Form.Select
  size="sm"
  value={t.assignedTo || ''}
  onChange={e => {
    setPendingAssign({ ticket: t, user: e.target.value });
    setShowAssignConfirm(true);
  }}
  disabled={role === 'manager'}
>
  <option value="">Unassigned</option>
  {adminUsers.map(user => (
    <option key={user.email} value={user.email}>
      {user.first_name} {user.last_name}
    </option>
  ))}
</Form.Select>

</td>

      <td>{new Date(t.created_at).toLocaleString()}</td>
      <td className="d-flex gap-1">
        <Button
          variant="info"
          size="sm"
          onClick={() => {
            setSelectedTicket(t);
            setShowModal(true);
          }}
        >
          <EyeFill />
        </Button>
        <Button
    variant="success"
    size="sm"
    onClick={() => {
      setSelectedTicket(t);
      setShowResponseModal(true);
    }}
  >
    💬
  </Button>
</td>
    </tr>
  ))}
</tbody>
</Table>

       {/* View Ticket Modal */}
<Modal show={showModal} onHide={() => setShowModal(false)}>
  <Modal.Header closeButton>
    <Modal.Title>View Ticket</Modal.Title>
  </Modal.Header>

  <Modal.Body>
    {selectedTicket && (
      <Card>
        <Card.Body>
          {/* Title + Status Badge */}
          <Card.Title className="d-flex justify-content-between align-items-center">
            {selectedTicket.title}
            <Badge bg={
              selectedTicket.status === 'Open' ? 'primary'
              : selectedTicket.status === 'In Progress' ? 'warning'
              : 'success'
            }>
              {selectedTicket.status}
            </Badge>
          </Card.Title>

          {/* Key Details */}
          <ListGroup variant="flush" className="mt-3">
            <ListGroup.Item>
              <strong>Description:</strong> {selectedTicket.description}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Priority:</strong> {selectedTicket.priority}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Submitted By:</strong> {selectedTicket.submitted_by}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Assigned To:</strong> {selectedTicket.assignedTo || 'Unassigned'}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Created At:</strong>{' '}
              {new Date(selectedTicket.created_at).toLocaleString()}
            </ListGroup.Item>
          </ListGroup>

          {/* Screenshots */}
          {selectedTicket.screenshots?.length > 0 && (
            <div className="mt-4">
              <strong>Screenshots:</strong>
              <div className="d-flex flex-wrap gap-2 mt-2">
                {selectedTicket.screenshots.map((src, idx) => {
                  const url = src.startsWith('http')
                    ? src
                    : `${axios.defaults.baseURL}${src}`;
                  return (
                    <Image
                      key={idx}
                      src={url}
                      thumbnail
                      style={{ maxWidth: '150px', cursor: 'pointer' }}
                      onClick={() => window.open(url, '_blank')}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    )}
  </Modal.Body>

  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowModal(false)}>
      Close
    </Button>
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
{/* High‑priority confirmation */}
<Modal
  show={showHighModal}
  onHide={() => setShowHighModal(false)}
  centered
>
  <Modal.Header closeButton>
    <Modal.Title>Make This a High‑Priority Ticket?</Modal.Title>
  </Modal.Header>

  <Modal.Body>
    {pendingHighTicket && (
      <>
        Ticket&nbsp;<strong>#{pendingHighTicket.id}</strong> –&nbsp;
        “{pendingHighTicket.title}”
      </>
    )}
    <p className="mt-3">
      Do you want to mark this ticket as <strong>High priority</strong>?
    </p>
  </Modal.Body>

  <Modal.Footer>
    <Button
      variant="secondary"
      onClick={() => setShowHighModal(false)}   /* No = close, keep old priority */
    >
      No
    </Button>

    <Button
      variant="danger"
      onClick={() => {
        if (!pendingHighTicket) return;
        /* 1️⃣ update on server */
        updateTicket(pendingHighTicket.id, { priority: 'High' });
        /* 2️⃣ update locally so UI refreshes */
        setAllTickets(prev =>
          prev.map(x =>
            x.id === pendingHighTicket.id ? { ...x, priority: 'High' } : x
          )
        );
        /* 3️⃣ close the modal */
        setShowHighModal(false);
        setPendingHighTicket(null);
        /* 4️⃣ (Step 4 will send e‑mails) */
      }}
    >
      Yes, make it High
    </Button>
  </Modal.Footer>
</Modal>
{/* Assign-confirmation Modal */}
<Modal
  show={showAssignConfirm}
  onHide={() => setShowAssignConfirm(false)}
  centered
>
  <Modal.Header closeButton>
    <Modal.Title>Confirm Assignment</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    Are you sure you want to assign ticket #
    <strong>{pendingAssign.ticket?.id}</strong> to 
    <strong>{pendingAssign.user}</strong>?
  </Modal.Body>
  <Modal.Footer>
    <Button
      variant="secondary"
      onClick={() => setShowAssignConfirm(false)}
    >
      No
    </Button>
    <Button
      variant="primary"
      onClick={handleConfirmAssign}
    >
      Yes
    </Button>
  </Modal.Footer>
</Modal>


      </div>
    </div>
  );
}


