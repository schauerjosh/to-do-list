import React, { useState, useEffect } from 'react';
import './App.css';

// Mock email sender for demo purposes
function sendEmail(email, tasks) {
  // Simulate sending and log to console
  return new Promise(resolve => {
    setTimeout(() => {
      // eslint-disable-next-line no-console
      console.log(`Pretend sent to ${email}:\n` + tasks.map((t, i) => `${i+1}. ${t.completed ? '[x]' : '[ ]'} ${t.text}`).join('\n'));
      resolve(true);
    }, 1000);
  });
}

function App() {
  const [tasks, setTasks] = useState(() => {
    const local = localStorage.getItem('tasks');
    return local ? JSON.parse(local) : [];
  });
  const [input, setInput] = useState('');
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState('idle');

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
  async function handleEmail() {
    setEmailStatus('sending');
    const ok = await sendEmail(email, tasks);
    setEmailStatus(ok ? 'sent' : 'error');
    setTimeout(() => setEmailStatus('idle'), 3000);
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
      <input
        className="add-input"
        style={{ marginTop: 18 }}
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Your email address"
      />
      <button className="email-btn" onClick={handleEmail} disabled={!email || !tasks.length || emailStatus==='sending'}>
        {emailStatus === 'sending' ? 'Sending...' : emailStatus === 'sent' ? 'Sent!' : emailStatus === 'error' ? 'Error!' : 'Email Me My List'}
      </button>
    </div>
  );
}

export default App;
