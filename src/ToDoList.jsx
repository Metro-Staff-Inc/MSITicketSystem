import React, { useState } from "react";

function ToDoList() {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [screenshot, setScreenshot] = useState(null);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    const task = {
      id: Date.now(),
      text: newTask,
      screenshot: screenshot ? URL.createObjectURL(screenshot) : null,
    };

    setTasks([task, ...tasks]);
    setNewTask("");
    setScreenshot(null);
    setShowForm(false);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 p-5 rounded-lg shadow-md w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-zinc-800 dark:text-white flex items-center gap-2">
          📝 Team To-Do List
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded shadow"
        >
          + Add
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddTask} className="mb-4 space-y-3">
          <textarea
            className="w-full p-2 border border-gray-300 rounded dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
            placeholder="Enter your task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            rows={3}
          ></textarea>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setScreenshot(e.target.files[0])}
            className="block text-sm text-gray-600 dark:text-gray-300"
          />

          <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow w-full"
          >
            Add Task
          </button>
        </form>
      )}

      <ul className="space-y-3">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="bg-gray-100 dark:bg-zinc-800 p-3 rounded shadow-sm"
          >
            <p className="text-zinc-800 dark:text-white">{task.text}</p>
            {task.screenshot && (
              <img
                src={task.screenshot}
                alt="screenshot"
                className="mt-2 rounded max-h-40 object-contain border border-gray-300 dark:border-zinc-700"
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ToDoList;
