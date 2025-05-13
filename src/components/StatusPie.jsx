// src/components/StatusPie.jsx
import React from 'react';
import { Card } from 'react-bootstrap';
import { Pie } from 'react-chartjs-2';

export default function StatusPie({ data, options }) {
  return (
    <Card className="p-3 shadow-sm h-100">
      <Card.Title>Tickets by Status</Card.Title>
      <Pie data={data} options={options} />
    </Card>
  );
}
