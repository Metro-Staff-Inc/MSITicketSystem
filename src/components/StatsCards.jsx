// src/components/StatsCards.jsx
import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';

export default function StatsCards({ openCount, inProgressCount, resolvedCount }) {
  return (
    <Row className="mb-4">
      <Col md={4}>
        <Card className="text-white bg-primary shadow-sm border-0">
          <Card.Body>
            <Card.Title>Open Tickets</Card.Title>
            <h3>{openCount}</h3>
          </Card.Body>
        </Card>
      </Col>
      <Col md={4}>
        <Card className="text-dark bg-warning shadow-sm border-0">
          <Card.Body>
            <Card.Title>In Progress</Card.Title>
            <h3>{inProgressCount}</h3>
          </Card.Body>
        </Card>
      </Col>
      <Col md={4}>
        <Card className="text-white bg-success shadow-sm border-0">
          <Card.Body>
            <Card.Title>Resolved Tickets</Card.Title>
            <h3>{resolvedCount}</h3>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
