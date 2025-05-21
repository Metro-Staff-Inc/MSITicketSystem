// src/TicketBoard.jsx
import React, { useState, useEffect } from 'react';
import { Button, Card, Modal, Form, Row, Col, Toast, ToastContainer } from 'react-bootstrap';
import { useTickets } from './TicketContext';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

// 👉 Tell axios to send requests to your backend API instead of the React dev server
axios.defaults.baseURL = 'https://ticketing-api-z0gp.onrender.com';



const fmtDate = iso =>
  new Date(iso).toLocaleString(
    'en-US',
    {
      month:  'short',
      day:    '2-digit',
      year:   'numeric',
      hour:   '2-digit',
      minute: '2-digit',
      hour12: true,              // gives you “AM / PM”
      timeZone: 'America/Chicago'
    }
  );



function TicketBoard() {
  const navigate    = useNavigate();
  const me          = localStorage.getItem("userEmail") || "";
  const { search }  = useLocation();
  const params      = new URLSearchParams(search);
  const userEmail   = params.get("user_email") || me;

  
  const {
    tickets,
    setTickets,
    archivedTickets,
    setArchivedTickets,
    createTicket,    
    updateTicket,    // ← grab your helper from context
  } = useTickets();

  const role = localStorage.getItem('role');
  const company = localStorage.getItem("company") || "";

  // List of companies who get the simplified form
const specialCompanies = ['BAC', 'Confirmifiy', 'Ari walsh'];

// Boolean flag for whether we need the simplified fields
const isSpecial = specialCompanies.includes(company);
console.log("📝 company:", company, "isSpecial:", isSpecial);



  useEffect(() => {
  // load active tickets
  axios
    //.get(`/tickets?user_email=${encodeURIComponent(userEmail)}&archived=false`)
    //.then(res => setTickets(res.data))
    //.catch(console.error);

  // load archived tickets
  axios
    .get(`/tickets?user_email=${encodeURIComponent(userEmail)}&archived=true`)
    .then(res => setArchivedTickets(res.data))
    .catch(console.error);
}, [userEmail, setTickets, setArchivedTickets]);

  const [darkMode, setDarkMode] = useState(() => {
    const storedMode = localStorage.getItem('darkMode');
    return storedMode
      ? JSON.parse(storedMode)
      : document.body.classList.contains('dark-mode');
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [showToast, setShowToast]       = useState(false);
  const [toastMessage, setToastMessage] = useState('');




  // archive moves into your archivedTickets bucket
    async function archiveTicket(ticketToArchive) {
      console.log("archiveTicket called for", ticketToArchive.id);
      // 1️⃣ Persist on the server
      await updateTicket(ticketToArchive.id, {
        archived: true,
        status:   'Canceled'
      });
    
      // 2️⃣ Build a local “archived” copy
      const updatedTicket = {
        ...ticketToArchive,
        archived: true,
        status:   'Canceled'
      };
    
      // 3️⃣ Remove it from the visible lists
      setTickets(prev => {
        const newBuckets = {};
        for (const key of Object.keys(prev)) {
          newBuckets[key] = prev[key].filter(t => t.id !== ticketToArchive.id);
        }
        return newBuckets;
      });
    
      // 4️⃣ Add it to your archivedTickets bucket
      setArchivedTickets(prev => [updatedTicket, ...prev]);
    }
    

  // your big form state
  const [form, setForm] = useState({
    requestedBy:   me, 
    subject: '',
    additionalPeople: '',
    msiLocation: '',
    onSiteLocation: '',
    helpType: '',
    category: '',
    details: '',
    customerImpacted: '',
    screenshot: null,
    onboarding: {
      firstName: '',
      lastName: '',
      startDate: '',
      officeLocation: '',
      needsCell: '',
      webtrax: '',
      needsComputer: '',
      sharedInbox: '',
      sharedInboxName: ''
    },
    offboarding: {
      firstName: '',
      lastName: '',
      convertInbox: ''
    }
  });

  const techCategories = ['Application help', 'Computer Login', 'General Computer issues', 'Office 365', 'Printing', 'VPN Connecting', 'Time Clock'];
  const requestCategories = ['WebTrax', 'TempWorks', 'New Computer', 'New Phone'];
  const msiLocations = ['Aurora', 'Bartlett', 'Bolingbrook', 'Burbank', 'Corporate', 'Elgin', 'Elk Grove', 'Palatine', 'Las Vegas', 'Melrose Park', 'On-Site', 'West Chicago'];
  const companyHelpTypes = {
  BAC:        ['BAC Issue A', 'BAC Issue B', 'BAC Request X'],
  Confirmifiy:['Confirm Option 1', 'Confirm Option 2', 'Confirm Request Y'],
  Arwalsh:    ['Arwalsh Help 1', 'Arwalsh Help 2', 'Arwalsh Request Z'],
};

  const handleFormChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'screenshot') {
      setForm({ ...form, screenshot: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleNestedChange = (section, field, value) => {
    setForm(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleEditClick = (ticket) => {
    setEditForm({ title: ticket.title, description: ticket.description });
    setSelectedTicket(ticket);
    setShowEditModal(true);
  };


  const cancelTicket = async (ticketId) => {
    console.log("➡️ cancelTicket called for", ticketId);
  try {
    await axios.post(`/tickets/${ticketId}/cancel`);
    
    setTickets(prev => {
      const newBuckets = {};
      for (const key of Object.keys(prev)) {
        newBuckets[key] = prev[key].filter(t => t.id !== ticketId);
      }
      return newBuckets;
    });
    // 2) Add it to archivedTickets
    setArchivedTickets(prev => [
      { id: ticketId, archived: true, status: 'Canceled' },
      ...prev
    ]);
    setToastMessage('✅ Ticket canceled and email sent!');
    setShowToast(true);
  } catch (err) {
    console.error(err);
    setToastMessage('❌ Failed to cancel ticket.');
    setShowToast(true);
  }
};

  return (
  <div className="container py-4">
    {/* Toast notifications */}
    <ToastContainer position="top-end" className="p-3">
      <Toast
        onClose={() => setShowToast(false)}
        show={showToast}
        delay={3000}
        autohide
        bg={toastMessage.startsWith('✅') ? 'success' : 'danger'}
      >
        <Toast.Body className="text-white">
          {toastMessage}
        </Toast.Body>
      </Toast>
    </ToastContainer>

    {/* Header */}
    <div className="d-flex justify-content-between align-items-center mb-4">
      <h2 className="fw-bold d-flex align-items-center">
        <img
          src="https://cdn-icons-png.flaticon.com/512/1828/1828970.png"
          alt="Ticket Icon"
          width="32"
          height="32"
          className="me-2 float-logo invert-icon"
        />
        Ticketing System
      </h2>
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
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('role');
            window.location.href = '/login';
          }}
        >
          🔒 Logout
        </Button>
      </div>
    </div>


      <h3 className="fw-bold mb-3">My Tickets</h3>
      <Row>
        {['Open', 'In Progress', 'Resolved'].map(status => (
          <Col key={status}>
            <Card className="mb-4">
              <Card.Body>
                <Card.Title>{status}</Card.Title>
                {tickets[status.toLowerCase()]?.filter(t => !t.archived).length === 0 ? (
                  <div className={`no-tickets-msg ${darkMode ? 'text-white' : 'text-muted'}`}>
                    No tickets found
                  </div>
                ) : (
                  tickets[status.toLowerCase()]
                    .filter(ticket => !ticket.archived)
                    .map((ticket, idx) => (
                      <Card key={ticket.id} className="mb-3 shadow-sm">
                        <Card.Body>
                          <Card.Subtitle className="fw-bold">{ticket.title}</Card.Subtitle>
                          <Card.Text className="mb-2 text-muted">{ticket.description}</Card.Text>
                          <Card.Text className="small">
                            👤 Submitted by: {ticket.submittedBy}<br />
                            Updated: {fmtDate(ticket.updated_at || ticket.updated)}<br />
                            Created: {fmtDate(ticket.created_at || ticket.created)}
                          </Card.Text>
                          <div className="d-flex gap-2">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => { setSelectedTicket(ticket); setShowViewModal(true); }}
                            >
                              👁 View
                            </Button>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => handleEditClick(ticket)}
                            >
                              ✏ Edit
                            </Button>
                            {(role === 'user' || role === 'manager') && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => cancelTicket(ticket.id)}
                            >
                              🗑 Cancel
                            </Button>
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    ))
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Submit Ticket Modal */}
<Modal
  show={showSubmitModal}
  onHide={() => setShowSubmitModal(false)}
  fullscreen="sm-down"
  centered
  size="lg"
>
  <Modal.Header closeButton>
    <Modal.Title>Submit Ticket</Modal.Title>
  </Modal.Header>

  <Modal.Body>
    <Form
      onSubmit={async e => {
        e.preventDefault();
        const payload = {
          title:        form.subject,
          description:  form.details,
          submitted_by: me,
          cc_email:     form.additionalPeople || null,
          status:       'Open',
          priority:     'Low',
          archived:     false,
          screenshot:   form.screenshot || null
        };
        try {
          await createTicket(payload);
          setShowSubmitModal(false);
        } catch (err) {
          console.error(err);
        }
      }}
    >
      {isSpecial ? (
        // ── Simplified form for BAC, Confirmifiy, Arwalsh ──
        <>
          {/* Subject */}
          <Form.Group className="mb-3">
            <Form.Label>Subject</Form.Label>
            <Form.Control
              type="text"
              name="subject"
              value={form.subject}
              onChange={handleFormChange}
              required
            />
          </Form.Group>

          {/* CC Emails */}
          <Form.Group className="mb-3">
            <Form.Label>What email do you want to be cc'd?</Form.Label>
            <Form.Control
              type="text"
              name="additionalPeople"
              value={form.additionalPeople}
              onChange={handleFormChange}
            />
          </Form.Group>

          {/* Location (fixed to Corporate) */}
          <Form.Group className="mb-3">
            <Form.Label>Location</Form.Label>
            <Form.Control
              type="text"
              name="msiLocation"
              value="Corporate"
              readOnly
            />
          </Form.Group>

          {/* Help Type */}
          <Form.Group className="mb-3">
            <Form.Label>What Do You Need Help With?</Form.Label>
            <Form.Select
              name="helpType"
              value={form.helpType}
              onChange={handleFormChange}
              required
            >
              <option value="">Select…</option>
              <option>Tech Issues</option>
              <option>Request</option>
            </Form.Select>
          </Form.Group>

          {/* Details */}
          <Form.Group className="mb-3">
            <Form.Label>Please describe what help or request is needed in detail</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="details"
              value={form.details}
              onChange={handleFormChange}
              required
            />
          </Form.Group>

          {/* Customer Impacted */}
          <Form.Group className="mb-3">
            <Form.Label>Is a customer directly impacted?</Form.Label>
            <Form.Select
              name="customerImpacted"
              value={form.customerImpacted}
              onChange={handleFormChange}
              required
            >
              <option value="">Select…</option>
              <option>Yes</option>
              <option>No</option>
            </Form.Select>
          </Form.Group>

          {/* Screenshot */}
          <Form.Group className="mb-3">
            <Form.Label>Upload Screenshot</Form.Label>
            <Form.Control
              type="file"
              name="screenshot"
              onChange={handleFormChange}
              accept="image/*"
            />
          </Form.Group>
        </>
      ) : (
        // ── Full MSI form for everyone else ──
        <>
          {/* Subject */}
          <Form.Group className="mb-3">
            <Form.Label>Subject</Form.Label>
            <Form.Control
              type="text"
              name="subject"
              value={form.subject}
              onChange={handleFormChange}
              required
            />
          </Form.Group>

          {/* CC Emails */}
          <Form.Group className="mb-3">
            <Form.Label>What email do you want to be cc'd?</Form.Label>
            <Form.Control
              type="text"
              name="additionalPeople"
              value={form.additionalPeople}
              onChange={handleFormChange}
            />
          </Form.Group>

          {/* MSI Location */}
          <Form.Group className="mb-3">
            <Form.Label>MSI Location</Form.Label>
            <Form.Select
              name="msiLocation"
              value={form.msiLocation}
              onChange={handleFormChange}
              required
            >
              <option value="">Select…</option>
              {msiLocations.map(loc => (
                <option key={loc}>{loc}</option>
              ))}
            </Form.Select>
          </Form.Group>

          {/* On‐site Location */}
          <Form.Group className="mb-3">
            <Form.Label>On-site Location</Form.Label>
            <Form.Control
              type="text"
              name="onSiteLocation"
              value={form.onSiteLocation}
              onChange={handleFormChange}
            />
          </Form.Group>

          {/* Help Type */}
          <Form.Group className="mb-3">
            <Form.Label>What Do You Need Help With?</Form.Label>
            <Form.Select
              name="helpType"
              value={form.helpType}
              onChange={handleFormChange}
              required
            >
              <option value="">Select…</option>
              <option>Tech Issue</option>
              <option>Request</option>
              <option>Onboarding</option>
              <option>Offboarding</option>
            </Form.Select>
          </Form.Group>

          {/* Category */}
          {['Tech Issue', 'Request'].includes(form.helpType) && (
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                name="category"
                value={form.category}
                onChange={handleFormChange}
                required
              >
                <option value="">Select…</option>
                {(form.helpType === 'Tech Issue' ? techCategories : requestCategories).map(cat => (
                  <option key={cat}>{cat}</option>
                ))}
              </Form.Select>
            </Form.Group>
          )}

          {/* Onboarding fields */}
          {form.helpType === 'Onboarding' && (
            <>
              {/* (your existing onboarding fields here) */}
            </>
          )}

          {/* Offboarding fields */}
          {form.helpType === 'Offboarding' && (
            <>
              {/* (your existing offboarding fields here) */}
            </>
          )}

          {/* Details */}
          <Form.Group className="mb-3">
            <Form.Label>Please describe what help or request is needed in detail</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="details"
              value={form.details}
              onChange={handleFormChange}
              required
            />
          </Form.Group>

          {/* Customer Impacted */}
          <Form.Group className="mb-3">
            <Form.Label>Is a customer directly impacted?</Form.Label>
            <Form.Select
              name="customerImpacted"
              value={form.customerImpacted}
              onChange={handleFormChange}
            >
              <option value="">Select…</option>
              <option>Yes</option>
              <option>No</option>
            </Form.Select>
          </Form.Group>

          {/* Screenshot */}
          <Form.Group className="mb-3">
            <Form.Label>Upload Screenshot</Form.Label>
            <Form.Control
              type="file"
              name="screenshot"
              onChange={handleFormChange}
              accept="image/*"
            />
          </Form.Group>
        </>
      )}

      <Button type="submit" variant="primary">
        Submit
      </Button>
    </Form>
  </Modal.Body>
</Modal>



      {/* Edit Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        fullscreen="sm-down"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Ticket</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTicket && (
            <Form
            onSubmit={e => {
              e.preventDefault();                       // stop page refresh
          
              // ⬇️ one‑liner that updates state (and DB, once you wire it)
              updateTicket(selectedTicket.id, {
                title:       editForm.title,
                description: editForm.description,
                updated_at:  new Date().toISOString(),
              });
          
              setShowEditModal(false);                  // close the popup
            }}
          >
          
              
              <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                />
              </Form.Group>
              <Button type="submit" variant="primary">
                Save Changes
              </Button>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default TicketBoard;
