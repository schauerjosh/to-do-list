import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [tasks, setTasks] = useState(() => {
    const local = localStorage.getItem('tasks');
    return local ? JSON.parse(local) : [];
  });
  const [input, setInput] = useState('');

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  const progress = total ? (completed / total) * 100 : 0;

  function addTask() {
    if (!input.trim()) return;
    setTasks([...tasks, { text: input.trim(), completed: false }]);
    setInput('');
  }
  function toggleTask(i) {
    setTasks(tasks => tasks.map((t, idx) => idx === i ? { ...t, completed: !t.completed } : t));
  }
  function removeTask(i) {
    setTasks(tasks => tasks.filter((_, idx) => idx !== i));
  }

  return (
    <div className="container">
      <h1 className="title">TO-DO LIST</h1>
      <div className="progress-bar-bg">
        <div className="progress-bar" style={{ width: `${progress}%` }} />
      </div>
      <div className="tasks-list">
        {tasks.map((task, i) => (
          <div className={`task${task.completed ? ' completed' : ''}`} key={i}>
            <span className="checkbox" onClick={() => toggleTask(i)}>
              {task.completed ? <span className="checkmark">✔</span> : <span className="box" />}
            </span>
            <span className="task-text">{task.text}</span>
            <button className="remove-btn" onClick={() => removeTask(i)} title="Remove">×</button>
          </div>
        ))}
      </div>
      <div className="add-task-row">
        <input
          className="add-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Add a task..."
          onKeyDown={e => e.key === 'Enter' && addTask()}
        />
        <button className="add-btn" onClick={addTask}>+ ADD TASK</button>
      </div>
    </div>
  );
}

export default App;
