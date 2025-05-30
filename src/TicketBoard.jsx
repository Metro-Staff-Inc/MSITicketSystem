// src/TicketBoard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Modal, Form, Row, Col, Toast, ToastContainer, Badge } from 'react-bootstrap';
import { useTickets } from './TicketContext';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Typeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.min.css';




const STATUS_COLORS = {
  Open:        'primary',
  'In Progress':'warning',
  Resolved:    'success',
};
const PRIORITY_COLORS = {
  High:   'danger',
  Medium: 'warning',
  Low:    'secondary',
};


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
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState('Open');



  
  const {
    tickets,
    setTickets,
    archivedTickets,
    setArchivedTickets,
    createTicket,    
    updateTicket,
    reloadTickets     // ← grab your helper from context
  } = useTickets();

  const role = localStorage.getItem('role');
  const company = localStorage.getItem("company") || "";

  // List of companies who get the simplified form
// List of companies who get the simplified form
const specialCompanies = ['BAC', 'Confirmify', 'Ari Walsh'];


// Boolean flag for whether we need the simplified fields
const isSpecial = specialCompanies.includes(company);
console.log("📝 company:", company, "isSpecial:", isSpecial);



  useEffect(() => {
  // load & group active tickets
  reloadTickets();

  // load archived tickets
  axios
    .get(
      `/tickets?user_email=${encodeURIComponent(
        userEmail
      )}&archived=true`
    )
    .then(res => setArchivedTickets(res.data))
    .catch(console.error);
}, [userEmail,]);


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

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [pendingCancelTicket, setPendingCancelTicket] = useState(null);




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

    // --- initial form template ---
const INITIAL_FORM = {
  requestedBy:   me,
  subject: '',
  msiLocation: '',
  onSiteLocation: '',
  helpType: '',
  category: '',
  details: '',
  customerImpacted: '',
  screenshots: [],
  attachments: [],
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
  },
  rensa: [
    { startDate: '', lastName: '', firstName: '', aident: '' }   // the first person
  ],
  ccEmails: [],

};

// --- helpers for array‑based forms ---
const addRensaPerson = (prev) => [
  ...prev,
  { startDate: '', lastName: '', firstName: '', aident: '' }
];

const removeRensaPerson = (prev, idx) =>
  prev.filter((_, i) => i !== idx);


  // your big form state
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const fileInputRef = useRef(null);   // 🔗 will point to the file chooser



  const techCategories = ['Application help', 'Computer Login', 'General Computer issues', 'Office 365', 'Printing', 'VPN Connecting', 'Time Clock'];
  const requestCategories = ['WebTrax', 'TempWorks', 'New Computer', 'New Phone', 'Start Date (Rensa)'];
  const msiLocations = ['Aurora', 'Bartlett', 'Bolingbrook', 'Burbank', 'Corporate', 'Elgin', 'Elk Grove', 'Palatine', 'Las Vegas', 'Melrose Park', 'On-Site', 'West Chicago'];
  const companyHelpTypes = {
  BAC:        ['BAC Issue A', 'BAC Issue B', 'BAC Request X'],
  Confirmifiy:['Confirm Option 1', 'Confirm Option 2', 'Confirm Request Y'],
  Arwalsh:    ['Arwalsh Help 1', 'Arwalsh Help 2', 'Arwalsh Request Z'],
};

  const handleFormChange = (e) => {
  const { name, files, value } = e.target;

  if (name === 'screenshots') {
    setForm(prev => ({
      ...prev,
      screenshots: [
        ...prev.screenshots,      // keep existing
        ...Array.from(files)      // add new ones
      ]
    }));
  } else {
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  }
};


const removeScreenshot = (idxToRemove) => {
  setForm(prev => ({
    ...prev,
    screenshots: prev.screenshots.filter((_, idx) => idx !== idxToRemove)
  }));
};


  const handleNestedChange = (section, field, value, idx = null) => {
  setForm(prev => ({
    ...prev,
    [section]: Array.isArray(prev[section])
      ? prev[section].map((obj, i) =>
          i === idx ? { ...obj, [field]: value } : obj
        )
      : {                            // ← original object path
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

{/* Search bar */}
<Row className="mb-3">
  <Col>
    <Form.Control
      type="search"
      placeholder="Search tickets..."
      value={searchTerm}
      onChange={e => setSearchTerm(e.target.value)}
    />
  </Col>
</Row>

{/* Tickets grouped by status */}
<Row>
  {['Open', 'In Progress', 'Resolved'].map(status => {
    // map the human-readable status to the key in your tickets object
    const key = status === 'In Progress' ? 'inProgress' : status.toLowerCase();
    // grab that array (or empty array if undefined)
    const bucket = tickets[key] || [];

    return (
      <Col key={status}>
        <Card className="mb-4">
          <Card.Body>
            <Card.Title>{status}</Card.Title>

            {bucket
              .filter(ticket => {
                const txt = (ticket.title + ' ' + ticket.description).toLowerCase();
                return txt.includes(searchTerm.toLowerCase());
              })
              .map(ticket => (
                <Card
                  key={ticket.id}
                  className="mb-3 shadow-sm"
                  style={{
                    borderLeft: `4px solid var(--bs-${PRIORITY_COLORS[ticket.priority]})`
                  }}
                >
                  <Card.Body>
                    <Card.Subtitle className="fw-bold d-flex align-items-center gap-2">
                      {ticket.title}{' '}
                      <Badge
                        bg={ticket.priority === 'High' ? 'danger' : 'secondary'}
                        className="me-2"
                      >
                        {ticket.priority}
                      </Badge>
                      <Badge bg={STATUS_COLORS[ticket.status]}>
                        {ticket.status}
                      </Badge>
                    </Card.Subtitle>

                    <Card.Text className="mb-2 text-muted">
                      {ticket.description}
                    </Card.Text>

                    <Card.Text className="small">
                      👤 Submitted by: {ticket.submittedBy}<br/>
                      Updated: {fmtDate(ticket.updated_at || ticket.updated)}<br/>
                      Created: {fmtDate(ticket.created_at || ticket.created)}
                    </Card.Text>

                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setShowViewModal(true);
                        }}
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
                          onClick={() => {
                            setPendingCancelTicket(ticket);
                            setShowCancelConfirm(true);
                          }}
                        >
                          🗑 Cancel
                        </Button>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              ))}
          </Card.Body>
        </Card>
      </Col>
    );
  })}
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
    // 1) build a FormData object
    const fd = new FormData();
    fd.append('title', form.subject);
// 👉 turn the chips into a single comma‑separated string
if (form.ccEmails.length) {
  fd.append('cc_email', form.ccEmails.join(','));
}


    // 📝 build the description
let desc = form.details;



/* If this ticket is “Start Date (Rensa)”, build a header for
   every person the user added */
if (form.category === 'Start Date (Rensa)') {
  const header = form.rensa
    .map((p, idx) => (
      `— Person ${idx + 1} —\n` +
      `🗓️ Start Date: ${p.startDate}\n` +
      `👤 Name:       ${p.lastName}, ${p.firstName}\n` +
      `🆔 Aident #:   ${p.aident}\n`
    ))
    .join('\n');      // blank line between people

  desc = `${header}\n\n${desc}`;   // prepend to narrative
}


fd.append('description', desc);

fd.append('submitted_by', me);
    fd.append('status',     'Open');
    fd.append('priority',   'Low');
    fd.append('archived',   'false');
    fd.append('location',   form.msiLocation || 'Corporate');

    fd.append('help_type',  form.helpType);
    fd.append('category',   form.category);
    // Tell the API whether a customer is impacted
fd.append(
  'customer_impacted',
  form.customerImpacted === 'Yes' ? 'true' : 'false'
);


      // 2) append each screenshot
  form.screenshots.forEach(file => fd.append('screenshots', file));
 // 3) append each attachment
 form.attachments.forEach(file => fd.append('attachments', file));

    try {
      await axios.post(
        '/tickets',
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setShowSubmitModal(false);
      reloadTickets();    // ← immediately refresh the ticket list
      setForm({ ...INITIAL_FORM });      // ← resets every field
      // 🔄 reset the <input type="file"> element
if (fileInputRef.current) fileInputRef.current.value = "";
form.screenshots.forEach(file => URL.revokeObjectURL(file));

    } catch (err) {
      console.error(err);
    }
  }}
>

      {isSpecial ? (
  // ── Simplified form for BAC, Confirmify, Ariwalsh ──
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

    {/* CC – add one or more addresses */}
<Form.Group className="mb-3">
  <Form.Label>CC (one or more emails)</Form.Label>
  <Typeahead
    id="ccEmailInputSpecial"
    multiple           // lets you add many
    allowNew
    options={[]}
    newSelectionPrefix="Add: "
    placeholder="Type address and hit Enter…"
    selected={form.ccEmails}
    onChange={sel =>
      setForm(prev => ({
        ...prev,
        ccEmails: sel.map(item =>
          typeof item === "string" ? item : item.label
        )
      }))
    }
  />
</Form.Group>




    {/* Location (always Corporate) */}
    <Form.Group className="mb-3">
      <Form.Label>Location</Form.Label>
      <Form.Control
        type="text"
        name="msiLocation"
        value="Corporate"
        readOnly
      />
    </Form.Group>

    {/* What do you need help with? */}
    <Form.Group className="mb-3">
      <Form.Label>What do you need help with?</Form.Label>
      <Form.Select
        name="helpType"
        value={form.helpType}
        onChange={handleFormChange}
        required
      >
        <option value="">Select…</option>
        <option>Tech Issue</option>
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

    {/* Upload Screenshot */}
    <Form.Group className="mb-3">
      <Form.Label>Upload Screenshot</Form.Label>
      <Form.Control
        type="file"
        name="screenshots"
        multiple
        onChange={handleFormChange}
        accept="image/*"
        ref={fileInputRef}
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

    {/* CC – add one or more addresses */}
<Form.Group className="mb-3">
  <Form.Label>CC (one or more emails)</Form.Label>

  <Typeahead
  labelKey={option => option}
  id="ccEmailInputRegular"
  multiple
  allowNew
  options={[]}
  newSelectionPrefix="Add: "
  placeholder="Type address and hit Enter…"
  selected={form.ccEmails}
  onChange={sel =>
    setForm(prev => ({
      ...prev,
      ccEmails: sel.map(item =>
        typeof item === 'string' ? item : item.label
      )
    }))
  }
/>

</Form.Group>

    {/* MSI Location */}
    <Form.Group className="mb-3">
      <Form.Label>MSI Location</Form.Label>
      <Form.Select
        name="msiLocation"
        value={form.msiLocation}
        onChange={handleFormChange}
        
      >
        <option value="">Select…</option>
        {msiLocations.map(loc => (
          <option key={loc}>{loc}</option>
        ))}
      </Form.Select>
    </Form.Group>

    {/* On‐site Location (only when MSI Location === “On-Site”) */}
{form.msiLocation === 'On-Site' && (
  <Form.Group className="mb-3">
    <Form.Label>On-site Location</Form.Label>
    <Form.Control
      type="text"
      name="onSiteLocation"
      value={form.onSiteLocation}
      onChange={handleFormChange}
    />
  </Form.Group>
)}


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
        {/* Extra fields for “Start Date (Rensa)” */}
{form.category === 'Start Date (Rensa)' && (
  <>
    {form.rensa.map((p, idx) => (
      <div key={idx} className="border rounded p-3 mb-3 bg-light-subtle">
        <h6 className="mb-3">
          Person&nbsp;{idx + 1}
          {form.rensa.length > 1 && (
            <Button
              variant="outline-danger"
              size="sm"
              className="ms-2"
              onClick={() =>
                setForm(prev => ({
                  ...prev,
                  rensa: removeRensaPerson(prev.rensa, idx)
                }))
              }
            >
              ×
            </Button>
          )}
        </h6>

        {/* Start Date */}
        <Form.Group className="mb-2">
          <Form.Label>Start Date </Form.Label>
          <Form.Control
            type="date"
            value={p.startDate}
            onChange={e =>
              handleNestedChange('rensa', 'startDate', e.target.value, idx)
            }
            required
          />
        </Form.Group>

        {/* Name */}
        <Row className="mb-2">
          <Col>
            <Form.Label>Last Name</Form.Label>
            <Form.Control
              value={p.lastName}
              onChange={e =>
                handleNestedChange('rensa', 'lastName', e.target.value, idx)
              }
              required
            />
          </Col>
          <Col>
            <Form.Label>First Name</Form.Label>
            <Form.Control
              value={p.firstName}
              onChange={e =>
                handleNestedChange('rensa', 'firstName', e.target.value, idx)
              }
              required
            />
          </Col>
        </Row>

        {/* Aident # */}
        <Form.Group>
          <Form.Label>Aident&nbsp;#</Form.Label>
          <Form.Control
            value={p.aident}
            onChange={e =>
              handleNestedChange('rensa', 'aident', e.target.value, idx)
            }
            required
          />
        </Form.Group>
      </div>
    ))}

    {/* + Add another person */}
    <Button
      variant="outline-primary"
      size="sm"
      onClick={() =>
        setForm(prev => ({ ...prev, rensa: addRensaPerson(prev.rensa) }))
      }
    >
      ＋ Add another person
    </Button>
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

    {/* Upload Screenshot */}
    <Form.Group className="mb-3">
      <Form.Label>Upload Screenshot</Form.Label>
      <Form.Control
        type="file"
        name="screenshots"
        multiple
        onChange={handleFormChange}
        accept="image/*"
        ref={fileInputRef}
      />
    </Form.Group>
    <Form.Group className="mb-3">
  <Form.Label>Attachments (any file types):</Form.Label>
  <Form.Control
    type="file"
    name="attachments"
    multiple
    onChange={e => {
      const files = Array.from(e.target.files);
      setForm(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...files]
      }));
    }}
    ref={fileInputRef}
  />
</Form.Group>



  </>
)}

{form.screenshots.length > 0 && (
  <div className="mb-3 d-flex flex-wrap gap-2">
    {form.screenshots.map((file, idx) => {
      const url = URL.createObjectURL(file)
      return (
        <div key={idx} style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={url}
            alt={`screenshot-${idx}`}
            style={{ width: 100, height: 'auto', objectFit: 'cover', borderRadius: 4 }}
          />
          <button
            type="button"
            onClick={() => removeScreenshot(idx)}
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              background: 'rgba(0,0,0,0.6)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: 20,
              height: 20,
              cursor: 'pointer',
              lineHeight: 1,
              fontSize: '0.9rem',
            }}
          >
            ×
          </button>
        </div>
      )
    })}
  </div>
)}

      <Button type="submit" variant="primary">
        Submit
      </Button>
    </Form>
  </Modal.Body>
</Modal>

{/* View Ticket Modal */}
<Modal
  show={showViewModal}
  onHide={() => setShowViewModal(false)}
  fullscreen="sm-down"
  centered
>
  <Modal.Header closeButton>
    <Modal.Title>View Ticket</Modal.Title>
  </Modal.Header>

  <Modal.Body>
    {selectedTicket && (
      <>
        <p><strong>Subject:</strong> {selectedTicket.title}</p>
        <p><strong>Description:</strong> {selectedTicket.description}</p>
        <p>
          <strong>Submitted by:</strong>{' '}
          {selectedTicket.submitted_by_name || selectedTicket.submittedBy}
        </p>
        <p><strong>Status:</strong> {selectedTicket.status}</p>
        <p><strong>Priority:</strong> {selectedTicket.priority}</p>

        {selectedTicket.cc_email && (
          <p>
            <strong>CC:</strong>{' '}
            {Array.isArray(selectedTicket.cc_email)
              ? selectedTicket.cc_email.join(', ')
              : selectedTicket.cc_email}
          </p>
        )}

        {/* Screenshots */}
        {selectedTicket.screenshots?.length > 0 && (
          <>
            <p><strong>Screenshots:</strong></p>
            <div className="d-flex flex-wrap gap-2 mb-3">
              {selectedTicket.screenshots.map((file, idx) => {
                const url = file.startsWith('http')
                  ? file
                  : `${axios.defaults.baseURL}${file}`;
                return (
                  <img
                    key={idx}
                    src={url}
                    alt={`screenshot-${idx}`}
                    style={{
                      maxWidth: '150px',
                      height: 'auto',
                      objectFit: 'contain',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                    onClick={() => window.open(url, '_blank')}
                  />
                );
              })}
            </div>
          </>
        )}

        {/* Attachments */}
        {selectedTicket.attachments?.length > 0 && (
          <>
            <p><strong>Attachments:</strong></p>
            <ul style={{ paddingLeft: 20 }}>
              {selectedTicket.attachments.map((file, idx) => {
                const url = file.startsWith('http')
                  ? file
                  : `${axios.defaults.baseURL}${file}`;
                const name = file.split('/').pop();
                return (
                  <li key={idx}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {name}
                    </a>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </>
    )}
  </Modal.Body>
</Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} fullscreen="sm-down" centered>
  <Modal.Header closeButton>
    <Modal.Title>Edit Ticket</Modal.Title>
  </Modal.Header>
  <Modal.Body className="p-4">
    
    {/* Section: Current Files */}
    {selectedTicket && (
      <div className="border rounded p-3 mb-4 bg-light">
        <h5 className="fw-bold">Current Files</h5>
        
        {/* Current Screenshots */}
        {selectedTicket.screenshots?.length > 0 && (
          <div className="mb-3">
            <Form.Label className="text-muted">Screenshots:</Form.Label>
            <div className="d-flex flex-wrap gap-2">
              {selectedTicket.screenshots.map((file, idx) => (
                <img key={idx} src={file} alt={`screenshot-${idx}`} className="border rounded" style={{ width: "120px", height: "auto", objectFit: "cover" }} />
              ))}
            </div>
          </div>
        )}

        {/* Current Attachments */}
        {selectedTicket.attachments?.length > 0 && (
          <div className="mb-3">
            <Form.Label className="text-muted">Attachments:</Form.Label>
            <ul className="list-unstyled">
              {selectedTicket.attachments.map((file, idx) => (
                <li key={idx} className="mb-2">
                  <a href={file} target="_blank" className="btn btn-outline-primary btn-sm">📎 {file.split("/").pop()}</a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )}

    {/* Section: Upload New Files */}
    <div className="border rounded p-3 mb-4 bg-light">
      <h5 className="fw-bold">Upload New Files</h5>
      
      <Form.Group className="mb-3">
        <Form.Label>Upload Screenshots:</Form.Label>
        <Form.Control type="file" multiple accept="image/*" />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Upload Attachments:</Form.Label>
        <Form.Control type="file" multiple />
      </Form.Group>
    </div>

    {/* Section: Edit Ticket Details */}
    <div className="border rounded p-3 bg-light">
      <h5 className="fw-bold">Edit Ticket Details</h5>

      <Form.Group className="mb-3">
        <Form.Label>Current Title:</Form.Label>
        <p className="text-muted">{selectedTicket.title}</p>
        <Form.Label>New Title:</Form.Label>
        <Form.Control type="text" placeholder="Enter new title..." value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Current Description:</Form.Label>
        <p className="text-muted">{selectedTicket.description}</p>
        <Form.Label>New Description:</Form.Label>
        <Form.Control as="textarea" rows={3} placeholder="Enter new description..." value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
      </Form.Group>
    </div>
    
    {/* Submit Button */}
    <Button type="submit" variant="primary" className="mt-3 w-100">💾 Save Changes</Button>
  </Modal.Body>
</Modal>

     {/* Cancel-confirmation Modal */}
<Modal
  show={showCancelConfirm}
  onHide={() => {
    setShowCancelConfirm(false);
    setPendingCancelTicket(null);
  }}
  centered
>
  <Modal.Header closeButton>
    <Modal.Title>Confirm Cancellation</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    Are you sure you want to cancel ticket #{pendingCancelTicket?.id}? This will archive the ticket.
  </Modal.Body>
  <Modal.Footer>
    <Button
      variant="secondary"
      onClick={() => {
        // Close the modal and clear selection
        setShowCancelConfirm(false);
        setPendingCancelTicket(null);
      }}
    >
      No, keep it
    </Button>
    <Button
      variant="danger"
      onClick={() => {
        // 1️⃣ Close the modal immediately
        setShowCancelConfirm(false);

        // 2️⃣ Remove from active tickets right away
        setTickets(prev => {
          const newBuckets = {};
          for (const key of Object.keys(prev)) {
            newBuckets[key] = prev[key].filter(t => t.id !== pendingCancelTicket.id);
          }
          return newBuckets;
        });

        // 3️⃣ Add to archived list right away
        setArchivedTickets(prev => [
          { ...pendingCancelTicket, archived: true, status: 'Canceled' },
          ...prev
        ]);

        // 4️⃣ Clear pending state
        const id = pendingCancelTicket.id;
        setPendingCancelTicket(null);

        // 5️⃣ Fire off the API call (in background)
        cancelTicket(id).catch(err => {
          console.error("Cancel failed:", err);
          // If it fails, reload to stay in sync
          reloadTickets();
        });
      }}
    >
      Yes, cancel
    </Button>
  </Modal.Footer>
</Modal>



    </div>
  );
}

export default TicketBoard;
