import React, { useState, useEffect } from "react";
import axios             from "axios";
import { nanoid }        from "nanoid";

/* ── constants ─────────────────────────────── */
const API_BASE    = "https://ticketing-api-z0gp.onrender.com";
const me          = localStorage.getItem("userEmail") || "unknown@none.com";

/* ── component ─────────────────────────────── */
function ToDoList() {
  /* state */
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [tasks,         setTasks]         = useState([]);
  const [completed,     setCompleted]     = useState([]);
  const [showCompleted, setShowCompleted] = useState(false);

  const [newTask,    setNewTask]    = useState("");
  const [screenshot, setScreenshot] = useState(null);

  /* assignee dropdown */
  const [admins,     setAdmins]     = useState([]);
  const [assignedTo, setAssignedTo] = useState("");

    // 🆕 add priority state (default to "Low")
  const [priority,   setPriority]   = useState("Low");

  // 🆕 edit‐modal state
const [showEditModal, setShowEditModal] = useState(false);
const [taskToEdit,    setTaskToEdit]    = useState(null);

// 🆕 fields for the edit modal
const [editText,       setEditText]       = useState("");
const [editAssignedTo, setEditAssignedTo] = useState("");
const [editPriority,   setEditPriority]   = useState("Low");




  /* ── fetch admins once ── */
  useEffect(() => {
    axios
      .get(`${API_BASE}/users?limit=1000`)
      .then(res => {
        const onlyAdmins = res.data.filter(
          u => u.role?.toLowerCase() === "admin"
        );
        setAdmins(onlyAdmins);
      })
      .catch(console.error);
  }, []);
  /* ── NEW: fetch tasks once ───────────────────────────────────── */
useEffect(() => {
  axios
    .get(`${API_BASE}/tasks?user_email=${me}`)   // grab your tasks
    .then(res => {
      const active    = res.data.filter(t => !t.completed);
      const completed = res.data.filter(t =>  t.completed);
      setTasks(active);
      setCompleted(completed);
    })
    .catch(console.error);
}, []);           // ⬅ run only on first render

  /* ── handlers ─────────────────────────────── */
  const handleAddTask = async (e) => {
  e.preventDefault();
  if (!newTask.trim()) return;

  try {
    /* 1️⃣ build a multipart/form‑data payload */
    const data = new FormData();
    data.append("text", newTask);        // required
    data.append("user_email", me);       // required
    if (assignedTo) data.append("assigned_to", assignedTo);
    if (screenshot) data.append("screenshot", screenshot);
    data.append("completed", "false");   // backend expects strings
    data.append("priority", "Low");      // default

    /* 2️⃣ save in DB */
    const res = await axios.post(`${API_BASE}/tasks`, data);

    /* 3️⃣ show instantly */
    setTasks((prev) => [res.data, ...prev]);

    /* 4️⃣ reset form */
    setNewTask("");
    setScreenshot(null);
    setShowTaskModal(false);
  } catch (err) {
    console.error("Couldn’t save task:", err.response?.data || err);
    alert("Something went wrong – check console");
  }
};

const handleEditTask = async (e) => {
  e.preventDefault();
  try {
    // 1️⃣ send the patch to the API
    const res = await axios.patch(
      `${API_BASE}/tasks/${taskToEdit.id}`,
      {
        text:        editText,
        assigned_to: editAssignedTo || null,
        priority:    editPriority,
      }
    );
    // 2️⃣ update your local tasks list
    setTasks(prev =>
      prev.map(t => (t.id === res.data.id ? res.data : t))
    );
    // 3️⃣ close the modal
    setShowEditModal(false);
  } catch (err) {
    console.error("Couldn’t save edits:", err.response?.data || err);
    alert("Failed to save changes – check console");
  }
};



  const handleComplete = async (taskId) => {
  try {
    /* 1️⃣ mark it complete in the backend */
    const res = await axios.put(
      `${API_BASE}/tasks/${taskId}/completed`,
      { completed: true }          // FastAPI endpoint expects { completed: true }
    );                              // ← res.data is the updated task row

    /* 2️⃣ move it from active → completed in the UI */
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setCompleted((prev) => [res.data, ...prev]);  // contains updated_at
  } catch (err) {
    console.error("Couldn’t mark task complete:", err.response?.data || err);
    alert("Failed to mark task complete – check console");
  }
};


  /* ── UI ───────────────────────────────────── */
  return (
    <div className="todo-card p-4 w-100">
      {/* header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold d-flex align-items-center gap-2 mb-0">
          <img
            src="https://cdn-icons-png.flaticon.com/512/1828/1828911.png"
            width="32"
            height="32"
            alt=""
          />
          Team To‑Do List
        </h2>

        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-primary px-3"
            onClick={() => setShowTaskModal(true)}
          >
            ＋ Task
          </button>

          <button
            className={
              "btn btn-sm px-3 " +
              (showCompleted ? "btn-success" : "btn-outline-success")
            }
            onClick={() => setShowCompleted(prev => !prev)}
          >
            ✅ Completed {showCompleted ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {/* Add Task Modal */}
{showTaskModal && (
  <div 
    className="modal fade show d-block"
    tabIndex="-1"
    role="dialog"
    style={{ background: "rgba(0,0,0,.5)" }}
  >
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content shadow-lg border rounded">
        
        {/* Modal Header */}
        <div className="modal-header bg-success text-white">
          <h5 className="modal-title mb-0">📝 Add a New Task</h5>
          <button className="btn-close btn-close-white" onClick={() => setShowTaskModal(false)} />
        </div>

        {/* Form */}
        <form onSubmit={handleAddTask}>
          <div className="modal-body p-4">
            
            {/* Task Description */}
            <textarea
              className="form-control mb-3 border shadow-sm"
              rows={3}
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Describe the task..."
            />

            {/* Assigned To */}
            <label className="small text-muted mb-1">👥 Assign To:</label>
            <select
              className="form-select mb-3 border shadow-sm"
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
            >
              <option value="">Select an assignee...</option>
              {admins.map(u => (
                <option key={u.email} value={u.email}>
                  {u.first_name} {u.last_name}
                </option>
              ))}
            </select>

            {/* Priority Selection */}
            <label className="small text-muted mb-1">🔥 Priority:</label>
            <select
              className="form-select mb-3 border shadow-sm"
              value={priority}
              onChange={e => setPriority(e.target.value)}
            >
              <option value="Low" className="text-success">Low</option>
              <option value="Medium" className="text-warning">Medium</option>
              <option value="High" className="text-danger">High</option>
            </select>

            {/* File Upload */}
            <label className="small text-muted mb-1">📎 Attach Screenshot:</label>
            <input
              type="file"
              className="form-control border shadow-sm"
              accept="image/*"
              onChange={e => setScreenshot(e.target.files[0])}
            />
          </div>

          {/* Modal Footer */}
          <div className="modal-footer bg-light d-flex justify-content-between">
            <button 
              type="button" 
              className="btn btn-outline-secondary shadow-sm" 
              onClick={() => setShowTaskModal(false)}
            >
              ❌ Cancel
            </button>
            <button type="submit" className="btn btn-success shadow-sm">
              ✅ Add Task
            </button>
          </div>
        </form>

      </div>
    </div>
  </div>
)}
      {/* Edit Task Modal */}
{showEditModal && (
  <div 
    className="modal fade show d-block"
    tabIndex="-1"
    role="dialog"
    style={{ background: "rgba(0,0,0,.5)" }}
  >
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content shadow-lg border rounded">
        
        {/* Modal Header */}
        <div className="modal-header bg-primary text-white">
          <h5 className="modal-title mb-0">✏️ Edit Task</h5>
          <button className="btn-close btn-close-white" onClick={() => setShowEditModal(false)} />
        </div>

        {/* Form */}
        <form onSubmit={handleEditTask}>
          <div className="modal-body p-4">
            
            {/* Task Description */}
            <textarea
              className="form-control mb-3 border shadow-sm"
              rows={3}
              value={editText}
              onChange={e => setEditText(e.target.value)}
              placeholder="Update the task details..."
            />

            {/* Assigned To */}
            <label className="small text-muted mb-1">👥 Assign To:</label>
            <select
              className="form-select mb-3 border shadow-sm"
              value={editAssignedTo}
              onChange={e => setEditAssignedTo(e.target.value)}
            >
              <option value="">Select an assignee...</option>
              {admins.map(u => (
                <option key={u.email} value={u.email}>
                  {u.first_name} {u.last_name}
                </option>
              ))}
            </select>

            {/* Priority */}
            <label className="small text-muted mb-1">🔥 Priority:</label>
            <select
              className="form-select mb-3 border shadow-sm"
              value={editPriority}
              onChange={e => setEditPriority(e.target.value)}
            >
              <option value="Low" className="text-success">Low</option>
              <option value="Medium" className="text-warning">Medium</option>
              <option value="High" className="text-danger">High</option>
            </select>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer bg-light d-flex justify-content-between">
            <button 
              type="button" 
              className="btn btn-outline-secondary shadow-sm" 
              onClick={() => setShowEditModal(false)}
            >
              ❌ Cancel
            </button>
            <button type="submit" className="btn btn-success shadow-sm">
              💾 Save
            </button>
          </div>
        </form>

      </div>
    </div>
  </div>
)}


{/* active tasks */}
<ul className="list-unstyled d-grid gap-3 mb-4">
  {tasks.map(task => (
    <li
      key={task.id}
      className="d-flex flex-column gap-3 p-3 rounded border shadow-sm"
      style={{ backgroundColor: "#f8f9fa", borderLeft: `5px solid ${task.priority === "High" ? "#dc3545" : task.priority === "Medium" ? "#ffc107" : "#28a745"}` }}
    >
      {/* 1️⃣ Main Row: Screenshot, Text, Edit + Complete Buttons */}
      <div className="d-flex align-items-center gap-3">
        {task.screenshot_url && (
          <img
            src={task.screenshot_url}
            alt="thumb"
            className="border rounded"
            style={{ height: 70, cursor: "pointer", transition: "transform 0.3s" }}
            onClick={() => window.open(task.screenshot_url, "_blank")}
            onMouseOver={e => e.target.style.transform = "scale(1.1)"}
            onMouseOut={e => e.target.style.transform = "scale(1.0)"}
          />
        )}
        <p className="mb-0 flex-grow-1 fw-bold">{task.text}</p>

        {/* Edit button */}
<button
  className="btn btn-sm btn-outline-primary me-2"
  onClick={() => {
    setTaskToEdit(task);
    setEditText(task.text);                         // 🆕 load current text
    setEditAssignedTo(task.assigned_to || "");      // 🆕 load current assignee
    setEditPriority(task.priority);                 // 🆕 load current priority
    setShowEditModal(true);
  }}
  title="Edit task"
>
  ✎ Edit
</button>


        <button
          className="btn btn-sm btn-success px-3 shadow-sm"
          onClick={() => handleComplete(task.id)}
          title="Mark complete"
        >
          ✔ Done
        </button>
      </div>

      {/* 2️⃣ Metadata Row */}
      <div className="d-flex justify-content-between align-items-center small">
        <span className="badge bg-secondary">{task.assigned_to || "Unassigned"}</span>
        <span className="badge bg-info">{new Date(task.created_at).toLocaleDateString()}</span>
        <span className={`badge ${task.priority === "High" ? "bg-danger" : task.priority === "Medium" ? "bg-warning" : "bg-success"}`}>
          {task.priority}
        </span>
      </div>
    </li>
  ))}
</ul>



      {/* Completed Tasks */}
{showCompleted && completed.length > 0 && (
  <>
    <h5 className="fw-bold mb-3 text-success">✅ Completed Tasks</h5>
    <ul className="list-unstyled d-grid gap-3">
      {completed.map(task => (
        <li
          key={task.id}
          className="d-flex align-items-center gap-3 p-3 rounded border shadow-sm"
          style={{ 
            backgroundColor: "#e9f7ef", 
            borderLeft: "5px solid #28a745", 
            opacity: 0.9 
          }}
        >
          {/* Thumbnail Screenshot */}
          {task.screenshot_url && (
            <img
              src={task.screenshot_url}
              alt="thumb"
              className="border rounded shadow-sm"
              style={{ height: 50, cursor: "pointer", transition: "transform 0.3s" }}
              onClick={() => window.open(task.screenshot_url, "_blank")}
              onMouseOver={e => e.target.style.transform = "scale(1.1)"}
              onMouseOut={e => e.target.style.transform = "scale(1.0)"}
            />
          )}

          {/* Task Description */}
          <span className="mb-0 flex-grow-1 fw-bold text-success">{task.text}</span>

          {/* Completion Date */}
          <span className="badge bg-light text-dark border border-success">
            📅 {new Date(task.updated_at).toLocaleDateString()}
          </span>
        </li>
      ))}
    </ul>
  </>
)}
    </div>
  );
}

export default ToDoList;
