// src/components/StatsCards.jsx
import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';

export default function StatsCards({ openCount, inProgressCount, resolvedCount, darkMode }) {
  // Define dynamic colors and text contrast
  const colors = {
    openBg: '#0d6efd',      // blue
    inProgressBg: '#ffc107',// yellow
    resolvedBg: '#198754',  // green
    textLight: darkMode ? 'white' : 'black',
    textDark:  darkMode ? '#222' : 'black',
  };

  return (
    <Row className="mb-4">
      <Col md={4}>
        <Card style={{ backgroundColor: colors.openBg }} className="shadow-sm border-0">
          <Card.Body style={{ backgroundColor: colors.openBg }}>
            <Card.Title style={{ color: colors.textLight }}>🟦 Open Tickets</Card.Title>
            <h3 style={{ color: colors.textLight }}>{openCount}</h3>
          </Card.Body>
        </Card>
      </Col>

      <Col md={4}>
        <Card style={{ backgroundColor: colors.inProgressBg }} className="shadow-sm border-0">
          <Card.Body style={{ backgroundColor: colors.inProgressBg }}>
            <Card.Title style={{ color: colors.textDark }}>🟨 In Progress</Card.Title>
            <h3 style={{ color: colors.textDark }}>{inProgressCount}</h3>
          </Card.Body>
        </Card>
      </Col>

      <Col md={4}>
        <Card style={{ backgroundColor: colors.resolvedBg }} className="shadow-sm border-0">
          <Card.Body style={{ backgroundColor: colors.resolvedBg }}>
            <Card.Title style={{ color: colors.textLight }}>🟩 Resolved Tickets</Card.Title>
            <h3 style={{ color: colors.textLight }}>{resolvedCount}</h3>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
