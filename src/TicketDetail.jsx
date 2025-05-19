// src/TicketDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Card, Spinner, Alert } from 'react-bootstrap';

export default function TicketDetail() {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    axios.get(`/tickets/${ticketId}`)
      .then(res => {
        setTicket(res.data);
      })
      .catch(err => {
        setError(err.response?.data?.detail || 'Failed to load ticket');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [ticketId]);

  if (loading) return <Spinner animation="border" />;
  if (error)   return <Alert variant="danger">{error}</Alert>;

  return (
    <Card className="mx-auto" style={{ maxWidth: '600px' }}>
      <Card.Header>
        <h4>Ticket #{ticket.id}: {ticket.title}</h4>
      </Card.Header>
      <Card.Body>
        <p><strong>Description:</strong></p>
        <p>{ticket.description}</p>
        <p><strong>Submitted by:</strong> {ticket.submitted_by_name || ticket.submitted_by}</p>
        <p><strong>Status:</strong> {ticket.status}</p>
        <p><strong>Priority:</strong> {ticket.priority}</p>
        <p><strong>Created:</strong> {new Date(ticket.created_at).toLocaleString()}</p>
        <p><strong>Updated:</strong> {new Date(ticket.updated_at).toLocaleString()}</p>
      </Card.Body>
    </Card>
  );
}
