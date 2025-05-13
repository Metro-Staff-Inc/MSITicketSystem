// src/components/ToDoList.jsx
import React from 'react';
import { Card, Form, Badge, Button } from 'react-bootstrap';

export default function ToDoList({
  tasks = [],                     // default to empty array
  filter,
  onFilterChange,
  showCompleted,
  onToggleShowCompleted,
  onAddClick,
  onClearCompleted,
  onToggleTask,
  onDeleteTask,
  editingId,
  editingText,
  setEditingId,
  setEditingText,
  onSaveEdit,
  openDetails,
  setOpenDetails
}) {
  return (
    <Card className="p-3 shadow-sm h-100">
      {/* header/buttons */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Card.Title className="mb-0">📝 Team To-Do List</Card.Title>
        <div className="d-flex gap-2">
          <Button size="sm" onClick={onAddClick}>+ Add</Button>
          <Button
            size="sm"
            variant={showCompleted ? "primary" : "outline-primary"}
            onClick={onToggleShowCompleted}
          >
            {showCompleted ? "Show All" : "Completed"}
          </Button>
          <Button size="sm" variant="danger" onClick={onClearCompleted}>
            Clear Completed
          </Button>
        </div>
      </div>

      {/* priority filter */}
      <Form.Select
        className="mb-3"
        value={filter}
        onChange={e => onFilterChange(e.target.value)}
      >
        <option>All</option>
        <option>High</option>
        <option>Medium</option>
        <option>Low</option>
      </Form.Select>

      {/* task list */}
      {tasks.map(task => (
        <div key={task.id} className="mb-2">
          <Card className={`mb-2 p-2 shadow-sm ${task.completed ? 'opacity-75' : ''}`}>
            <div className="d-flex align-items-center justify-content-between">
              <Form.Check
                type="checkbox"
                checked={task.completed}
                onChange={() => onToggleTask(task)}
                label={
                  editingId === task.id ? (
                    <Form.Control
                      type="text"
                      value={editingText}
                      onChange={e => setEditingText(e.target.value)}
                      onBlur={onSaveEdit}
                      onKeyDown={e => e.key === 'Enter' && onSaveEdit()}
                      autoFocus
                    />
                  ) : (
                    <span
                      className={`ms-2 ${task.completed ? 'text-decoration-line-through text-muted' : ''}`}
                      onDoubleClick={() => {
                        setEditingId(task.id);
                        setEditingText(task.text);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {task.text}
                    </span>
                  )
                }
              />
              <div className="d-flex gap-2">
                <Button size="sm" onClick={() => onToggleTask(task)}>
                  {task.completed ? 'Undo' : 'Done'}
                </Button>
                <Button size="sm" variant="outline-danger" onClick={() => onDeleteTask(task.id)}>
                  ✕
                </Button>
                <Button
                  size="sm"
                  variant="outline-info"
                  onClick={() =>
                    setOpenDetails(d => ({ ...d, [task.id]: !d[task.id] }))
                  }
                >
                  {openDetails[task.id] ? 'Hide Details' : 'Show Details'}
                </Button>
              </div>
            </div>
            <div className="d-flex gap-2 mt-2">
              <Badge
                bg={
                  task.priority === 'High'
                    ? 'danger'
                    : task.priority === 'Medium'
                    ? 'warning'
                    : 'secondary'
                }
              >
                {task.priority}
              </Badge>
              {task.screenshot_url && (
                <a href={task.screenshot_url} target="_blank" rel="noreferrer">
                  📌
                </a>
              )}
              {task.assigned_to && (
                <div className="ms-4 text-muted">👤 {task.assigned_to}</div>
              )}
            </div>
          </Card>

          {openDetails[task.id] && (
            <div className="ms-4 mt-2 text-muted small">
              <div>Created: {new Date(task.created_at).toLocaleString()}</div>
              <div>Updated: {new Date(task.updated_at).toLocaleString()}</div>
              {task.screenshot_url && (
                <img
                  src={task.screenshot_url}
                  alt="screenshot"
                  style={{ maxWidth: '100px', marginTop: '0.5rem' }}
                />
              )}
            </div>
          )}
        </div>
      ))}
    </Card>
  );
}
