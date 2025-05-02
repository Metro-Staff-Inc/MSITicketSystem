// src/TicketBoard.jsx
import React, { useState, useEffect } from 'react';
import { Button, Card, Modal, Form, Row, Col } from 'react-bootstrap';
import { useTickets } from './TicketContext';
import { useNavigate } from 'react-router-dom';

function TicketBoard() {
  const navigate = useNavigate();
  const {
    tickets,
    setTickets,
    archivedTickets,
    setArchivedTickets,
    createTicket,        // ← grab your helper from context
  } = useTickets();

  const role = localStorage.getItem('role');

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

  // cancel simply marks archived in place
  const cancelTicket = (ticketId) => {
    setTickets(prev =>
      prev.map(ticket =>
        ticket.id === ticketId ? { ...ticket, archived: true } : ticket
      )
    );
  };

  // archive moves into your archivedTickets bucket
  const archiveTicket = (ticketToArchive) => {
    const updatedTicket = { ...ticketToArchive, archived: true };

    setTickets(prev => {
      const updated = {};
      for (const key of Object.keys(prev)) {
        updated[key] = prev[key].map(ticket =>
          ticket.id === ticketToArchive.id ? updatedTicket : ticket
        );
      }
      return updated;
    });

    setArchivedTickets(prev => [...prev, updatedTicket]);
  };

  // your big form state
  const [form, setForm] = useState({
    requestedBy: '',
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

  return (
    <div className="container py-4">
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
          <Button variant="outline-danger" onClick={() => {
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('role');
            window.location.href = '/login';
          }}>
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
                            Updated: {ticket.updated}<br />
                            Created: {ticket.created}
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
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => archiveTicket(ticket)}
                            >
                              🗑 Cancel
                            </Button>
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
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Submit Ticket</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={async e => {
            e.preventDefault();
            // build the same payload you had
            const payload = {
              title:        form.subject,
              description:  form.details,
              submitted_by: form.requestedBy,
              status:       'Open',
              priority:     'Medium',
              screenshot:   null
            };
            try {
              // this POSTes + updates your `tickets.open` internally
              await createTicket(payload);
              setShowSubmitModal(false);
            } catch (err) {
              console.error(err);
            }
          }}>
            <Form.Group className="mb-3">
              <Form.Label>Requested by</Form.Label>
              <Form.Control type="text" name="requestedBy" onChange={handleFormChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Subject</Form.Label>
              <Form.Control type="text" name="subject" onChange={handleFormChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Who else needs the request?</Form.Label>
              <Form.Control type="text" name="additionalPeople" onChange={handleFormChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>MSI Location</Form.Label>
              <Form.Select name="msiLocation" onChange={handleFormChange} required>
                <option value="">Select...</option>
                {msiLocations.map(loc => <option key={loc}>{loc}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>On-site Location</Form.Label>
              <Form.Control type="text" name="onSiteLocation" onChange={handleFormChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>What Do You Need Help With?</Form.Label>
              <Form.Select
                name="helpType"
                value={form.helpType}
                onChange={handleFormChange}
                required
              >
                <option value="">Select...</option>
                <option>Tech Issue</option>
                <option>Request</option>
                <option>Onboarding</option>
                <option>Offboarding</option>
              </Form.Select>
            </Form.Group>

            {['Tech Issue', 'Request'].includes(form.helpType) && (
              <Form.Group className="mb-3">
                <Form.Label>Category</Form.Label>
                <Form.Select name="category" onChange={handleFormChange} required>
                  <option value="">Select...</option>
                  {(form.helpType === 'Tech Issue' ? techCategories : requestCategories).map(cat => (
                    <option key={cat}>{cat}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            {form.helpType === 'Onboarding' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    onChange={e => handleNestedChange('onboarding','firstName',e.target.value)}
                  />
                </Form.Group>
                {/* …rest of your onboarding fields exactly as before… */}
              </>
            )}

            {form.helpType === 'Offboarding' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    onChange={e => handleNestedChange('offboarding','firstName',e.target.value)}
                  />
                </Form.Group>
                {/* …rest of your offboarding fields exactly as before… */}
              </>
            )}

            <Form.Group className="mb-3">
              <Form.Label>
                Please describe what help or request is needed in detail
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="details"
                onChange={handleFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Is a customer directly impacted?</Form.Label>
              <Form.Select
                name="customerImpacted"
                onChange={handleFormChange}
                required
              >
                <option value="">Select</option>
                <option>Yes</option>
                <option>No</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Upload Screenshot</Form.Label>
              <Form.Control
                type="file"
                name="screenshot"
                onChange={handleFormChange}
                accept="image/*"
              />
            </Form.Group>

            <Button type="submit" variant="primary">
              Submit
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* View Modal */}
      <Modal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>View Ticket</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTicket && (
            <>
              <p><strong>Title:</strong> {selectedTicket.title}</p>
              <p><strong>Description:</strong> {selectedTicket.description}</p>
              <p><strong>Submitted By:</strong> {selectedTicket.submittedBy}</p>
              <p><strong>Created:</strong> {selectedTicket.created}</p>
              <p><strong>Updated:</strong> {selectedTicket.updated}</p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Ticket</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTicket && (
            <Form onSubmit={e => {
              e.preventDefault();
              setShowEditModal(false);
            }}>
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
