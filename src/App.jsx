import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { suggestTask } from './aiPriority';
import { mindDumpSort } from './aiMindDump';
import './App.css';

// --- Utility Functions ---
function formatTasksForEmail(tasks) {
  return tasks.map((t, i) => `${i + 1}. ${t.completed ? '[x]' : '[ ]'} ${t.text}`).join('\n');
}

function sendEmailMock(email, tasks) {
  return new Promise(resolve => {
    setTimeout(() => {
      // eslint-disable-next-line no-console
      console.log(`Pretend sent to ${email}:\n` + formatTasksForEmail(tasks));
      resolve(true);
    }, 1000);
  });
}

// --- Main Component ---
function App() {
  const [tasks, setTasks] = useState(() => {
    const local = localStorage.getItem('tasks');
    return local ? JSON.parse(local) : [];
  });
  const [input, setInput] = useState('');
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState('idle');

  // --- New State for Missed Task Prompt ---
  const [missPromptIdx, setMissPromptIdx] = useState(null);
  const [missReason, setMissReason] = useState('');

  // --- New State for Recurring Tasks ---
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);
  const [recurringInput, setRecurringInput] = useState({ text: '', type: 'daily', interval: 1 });

  // --- New State for Mind Dump ---
  const [mindDumpOpen, setMindDumpOpen] = useState(false);
  const [mindDumpText, setMindDumpText] = useState('');
  const [mindDumpResult, setMindDumpResult] = useState(null);

  const [animStates, setAnimStates] = useState({}); // { [taskIdx]: 'pop' | 'shake' | null }
  const containerRef = useRef(null);

  const completed = useMemo(() => tasks.filter(t => t.completed).length, [tasks]);
  const total = tasks.length;
  const progress = total ? (completed / total) * 100 : 0;

  // --- New State for Shared Tasks ---
  const [sharedEmail, setSharedEmail] = useState('');
  const [sharedList, setSharedList] = useState([]); // [{ email, tasks: [idx], nudged: false, checkin: false }]

  // --- New State for Email and Add Task Input Visibility ---
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showMindDumpModal, setShowMindDumpModal] = useState(false);
  const [showMoodToaster, setShowMoodToaster] = useState(true);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    // Animate mood toaster on load, hide after 3.5s or when mood is picked
    if (showMoodToaster) {
      const t = setTimeout(() => setShowMoodToaster(false), 3500);
      return () => clearTimeout(t);
    }
  }, [showMoodToaster]);

  // --- Task Handlers ---
  const addTask = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setTasks(tsk => [...tsk, { text: trimmed, completed: false }]);
    setInput('');
  }, [input]);

  const toggleTask = useCallback(i => {
    setAnimStates(s => ({ ...s, [i]: 'pop' }));
    setTimeout(() => setAnimStates(s => ({ ...s, [i]: null })), 350);
    setTasks(tsk => tsk.map((t, idx) => {
      if (idx !== i) return t;
      // If recurring, on complete: advance nextDue, reset completed
      if (t.recurring && !t.completed) {
        let nextDue = t.recurring.nextDue;
        const now = Date.now();
        if (t.recurring.type === 'daily') {
          nextDue = now + 24 * 60 * 60 * 1000 * t.recurring.interval;
        } else if (t.recurring.type === 'weekly') {
          nextDue = now + 7 * 24 * 60 * 60 * 1000 * t.recurring.interval;
        } else if (t.recurring.type === 'custom') {
          nextDue = now + 24 * 60 * 60 * 1000 * t.recurring.interval;
        }
        return {
          ...t,
          completed: true,
          recurring: { ...t.recurring, nextDue },
          history: [...(t.history || []), { type: 'completed', date: now }],
        };
      }
      // Non-recurring: just toggle completed
      return { ...t, completed: !t.completed };
    }));
  }, []);

  const markTaskMissed = useCallback(idx => {
    setAnimStates(s => ({ ...s, [idx]: 'shake' }));
    setTimeout(() => setAnimStates(s => ({ ...s, [idx]: null })), 400);
    setMissPromptIdx(idx);
    setMissReason('');
  }, []);

  const removeTask = useCallback(i => {
    setTasks(tsk => tsk.filter((_, idx) => idx !== i));
  }, []);

  const handleEmail = useCallback(async () => {
    setEmailStatus('sending');
    const ok = await sendEmailMock(email, tasks);
    setEmailStatus(ok ? 'sent' : 'error');
    setTimeout(() => setEmailStatus('idle'), 3000);
  }, [email, tasks]);

  // --- New: Mark Task as Missed ---
  const submitMissReason = useCallback(() => {
    setTasks(tsk => tsk.map((t, idx) => idx === missPromptIdx
      ? {
          ...t,
          missedCount: (t.missedCount || 0) + 1,
          lastMissedReason: missReason,
          history: [...(t.history || []), { type: 'missed', reason: missReason, date: Date.now() }],
        }
      : t
    ));
    setMissPromptIdx(null);
    setMissReason('');
  }, [missPromptIdx, missReason]);

  // --- New: Add Recurring Task ---
  const addRecurringTask = useCallback(() => {
    const trimmed = recurringInput.text.trim();
    if (!trimmed) return;
    setTasks(tsk => [
      ...tsk,
      {
        text: trimmed,
        completed: false,
        recurring: {
          type: recurringInput.type,
          interval: Number(recurringInput.interval) || 1,
          nextDue: Date.now(),
        },
        missedCount: 0,
        lastMissedReason: '',
        history: [],
      },
    ]);
    setRecurringInput({ text: '', type: 'daily', interval: 1 });
    setRecurringModalOpen(false);
  }, [recurringInput]);

  // --- Helper: Format Next Due Date ---
  function formatNextDue(tsk) {
    if (!tsk.recurring) return null;
    const d = new Date(tsk.recurring.nextDue);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const [userState, setUserState] = useState({ energy: 'normal' });
  const [mood, setMood] = useState('neutral');
  const [suggested, setSuggested] = useState(null);

  // Use mood in AI suggestion
  const handleSuggest = useCallback(() => {
    const task = suggestTask(tasks, { ...userState, mood });
    setSuggested(task);
  }, [tasks, userState, mood]);

  const handleMindDump = useCallback(() => {
    setMindDumpResult(mindDumpSort(mindDumpText));
  }, [mindDumpText]);

  const handleAddMindDumpTasks = useCallback(() => {
    if (!mindDumpResult) return;
    setTasks(tsk => [
      ...tsk,
      ...mindDumpResult.tags.map(t => ({ text: t.text, completed: false, tag: t.tag }))
    ]);
    setMindDumpOpen(false);
    setMindDumpText('');
    setMindDumpResult(null);
  }, [mindDumpResult]);

  // Share a task (mocked)
  const handleShareTask = useCallback((i) => {
    if (!sharedEmail.trim()) return;
    setSharedList(list => {
      const found = list.find(l => l.email === sharedEmail.trim());
      if (found) {
        return list.map(l => l.email === sharedEmail.trim() ? { ...l, tasks: [...new Set([...l.tasks, i])] } : l);
      }
      return [...list, { email: sharedEmail.trim(), tasks: [i], nudged: false, checkin: false }];
    });
    setSharedEmail('');
  }, [sharedEmail]);

  // Nudge/check-in (mocked)
  const handleNudge = useCallback((email) => {
    setSharedList(list => list.map(l => l.email === email ? { ...l, nudged: true } : l));
    setTimeout(() => setSharedList(list => list.map(l => l.email === email ? { ...l, nudged: false } : l)), 1500);
  }, []);
  const handleCheckin = useCallback((email) => {
    setSharedList(list => list.map(l => l.email === email ? { ...l, checkin: true } : l));
    setTimeout(() => setSharedList(list => list.map(l => l.email === email ? { ...l, checkin: false } : l)), 1500);
  }, []);

  // --- Progress, Not Perfection: Streaks & Progress ---
  // Helper to update a task's progress and streak
  const updateTaskProgress = useCallback((i, newProgress) => {
    setTasks(tsk => tsk.map((t, idx) => {
      if (idx !== i) return t;
      const now = Date.now();
      let streak = t.streak || 0;
      let lastWorked = t.lastWorked || 0;
      // Use Date.now for testability
      const today = new Date(Date.now()).toDateString();
      const lastWorkedDay = lastWorked ? new Date(lastWorked).toDateString() : null;
      if (newProgress > (t.progress || 0)) {
        if (lastWorkedDay !== today) streak = streak + 1;
        lastWorked = now;
      }
      return {
        ...t,
        progress: newProgress,
        streak,
        lastWorked,
        history: [...(t.history || []), { type: 'progress', value: newProgress, date: now }],
      };
    }));
  }, []);

  // Handler for "Worked on it" button
  const handleWorkedOnIt = useCallback(i => {
    setTasks(tsk => tsk.map((t, idx) => {
      if (idx !== i) return t;
      const now = Date.now();
      let streak = t.streak || 0;
      let lastWorked = t.lastWorked || 0;
      // Use Date.now for testability
      const today = new Date(Date.now()).toDateString();
      const lastWorkedDay = lastWorked ? new Date(lastWorked).toDateString() : null;
      if (lastWorkedDay !== today) streak = streak + 1;
      lastWorked = now;
      return {
        ...t,
        progress: Math.min(100, (t.progress || 0) + 10),
        streak,
        lastWorked,
        history: [...(t.history || []), { type: 'worked', date: now }],
      };
    }));
  }, []);

  // --- AI Tip for Task ---
  function getAiTip(task) {
    if (!task) return '';
    if (task.completed) return 'Great job! Celebrate your progress.';
    if ((task.missedCount || 0) >= 3) return getTipForTask(task);
    if (task.progress >= 80) return 'Almost done! One last push.';
    if (task.streak >= 3) return 'You are on a roll! Keep the streak alive.';
    return 'Break it down, start small, and just begin!';
  }

  // --- AI Idea for Creative Tasks ---
  function getAiIdea(task) {
    if (!task || !task.text) return '';
    const txt = task.text.toLowerCase();
    if (txt.startsWith('come up with') || txt.startsWith('brainstorm') || txt.startsWith('generate idea') || txt.includes('idea for')) {
      // Simple AI idea generator (could be replaced with real AI call)
      if (txt.includes('app')) return 'How about a habit tracker that rewards you with AI-generated art?';
      if (txt.includes('business')) return 'Try a subscription box for remote workers: snacks, gadgets, and wellness tools.';
      if (txt.includes('name')) return 'Use a portmanteau of your values, e.g., "EcoVibe" for a green brand.';
      if (txt.includes('project')) return 'A community garden with a digital logbook for plant care.';
      // Generic creative idea
      return 'Start with a mind map, then pick the most fun or bold idea!';
    }
    return '';
  }

  return (
    <div className="container" ref={containerRef}>
      <h1 className="page-title">Next-Gen To-Do List</h1>
      <div className="progress-bar-bg">
        <div className="progress-bar" style={{ width: `${progress}%` }} />
      </div>
      {/* --- Mood Toaster --- */}
      {showMoodToaster && (
        <div className="toaster mood-toaster fade-in-up">
          <span className="toaster-title">How are you feeling?</span>
          <div className="toaster-moods">
            <button className={`mood-btn${mood==='focused'?' selected':''}`} onClick={()=>{setMood('focused');setShowMoodToaster(false);}} title="Focused" aria-label="Focused">😃</button>
            <button className={`mood-btn${mood==='neutral'?' selected':''}`} onClick={()=>{setMood('neutral');setShowMoodToaster(false);}} title="Neutral" aria-label="Neutral">😐</button>
            <button className={`mood-btn${mood==='foggy'?' selected':''}`} onClick={()=>{setMood('foggy');setShowMoodToaster(false);}} title="Foggy" aria-label="Foggy">😵‍💫</button>
            <button className={`mood-btn${mood==='tired'?' selected':''}`} onClick={()=>{setMood('tired');setShowMoodToaster(false);}} title="Tired" aria-label="Tired">😴</button>
          </div>
        </div>
      )}
      {/* --- End Mood Toaster --- */}
      <div className="tasks-list">
        {tasks.map((task, i) => (
          <div className={`task${task.completed ? ' completed' : ''} ${animStates[i] || ''}`.trim()} key={i}>
            <span className="checkbox" aria-label="Toggle task completion" onClick={() => toggleTask(i)} data-testid="checkbox">
              {task.completed ? <span className="checkmark">✔</span> : <span className="box" />}
            </span>
            <span className="task-title">{task.text}</span>
            {/* --- AI Tip --- */}
            <div className="ai-tip">💡 {getAiTip(task)}</div>
            {/* --- AI Idea for Creative Tasks --- */}
            {getAiIdea(task) && (
              <div className="ai-idea">✨ AI Idea: {getAiIdea(task)}</div>
            )}
            {/* --- Progress Slider & Worked On It Button --- */}
            <div className="progress-row">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={task.progress || 0}
                onChange={e => updateTaskProgress(i, Number(e.target.value))}
                className="progress-slider"
                aria-label="Task progress"
                style={{marginLeft:8, marginRight:8, verticalAlign:'middle'}}
              />
              <span className="progress-label">{task.progress || 0}%</span>
              <button className="worked-btn" onClick={() => handleWorkedOnIt(i)} style={{marginLeft:8}}>Worked on it</button>
              {task.streak > 0 && (
                <span className="streak-label" title="Momentum!" style={{marginLeft:8, color:'#ffd700', fontWeight:600}}>
                  🔥 {task.streak}d
                </span>
              )}
            </div>
            {task.recurring && (
              <span className="recurring-info">Recurring: {task.recurring.type==='custom'?`Every ${task.recurring.interval} days`:task.recurring.type} | Next: {formatNextDue(task)}</span>
            )}
            <button className="remove-btn" onClick={() => removeTask(i)} title="Remove">×</button>
            <button className="miss-btn" onClick={() => markTaskMissed(i)} title="Mark as Missed">Missed?</button>
          </div>
        ))}
      </div>
      {/* Missed Reason Prompt Modal */}
      {missPromptIdx !== null && (
        <div className="modal-bg">
          <div className="modal">
            <h3>Why did you miss this task?</h3>
            <input
              className="add-input"
              value={missReason}
              onChange={e => setMissReason(e.target.value)}
              placeholder="Why did you miss this task?"
              autoFocus
            />
            <button className="add-btn" onClick={submitMissReason} disabled={!missReason.trim()}>Submit</button>
            <button className="remove-btn" onClick={() => setMissPromptIdx(null)}>Cancel</button>
          </div>
        </div>
      )}
      {/* Recurring Task Modal */}
      {recurringModalOpen && (
        <div className="modal-bg">
          <div className="modal">
            <h3>Add Recurring Task</h3>
            <input
              className="add-input"
              value={recurringInput.text}
              onChange={e => setRecurringInput(v => ({ ...v, text: e.target.value }))}
              placeholder="Task description"
              autoFocus
            />
            <div style={{margin:'12px 0'}}>
              <label>
                <input type="radio" name="rtype" checked={recurringInput.type==='daily'} onChange={()=>setRecurringInput(v=>({...v,type:'daily'}))}/> Daily
              </label>
              <label style={{marginLeft:12}}>
                <input type="radio" name="rtype" checked={recurringInput.type==='weekly'} onChange={()=>setRecurringInput(v=>({...v,type:'weekly'}))}/> Weekly
              </label>
              <label style={{marginLeft:12}}>
                <input type="radio" name="rtype" checked={recurringInput.type==='custom'} onChange={()=>setRecurringInput(v=>({...v,type:'custom'}))}/> Custom every
                <input
                  type="number"
                  min="1"
                  value={recurringInput.interval}
                  onChange={e => setRecurringInput(v => ({ ...v, type:'custom', interval: e.target.value }))}
                  style={{width:40,marginLeft:4,marginRight:4}}
                  disabled={recurringInput.type!=='custom'}
                /> days
              </label>
            </div>
            <button className="add-btn" onClick={addRecurringTask} disabled={!recurringInput.text.trim()}>Add</button>
            <button className="remove-btn" onClick={()=>setRecurringModalOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
      {/* Mind Dump Modal */}
      {mindDumpOpen && (
        <div className="modal-bg">
          <div className="mind-dump-modal">
            <h3>Brain Dump</h3>
            <textarea
              className="mind-dump-textarea"
              value={mindDumpText}
              onChange={e=>setMindDumpText(e.target.value)}
              placeholder="Type anything on your mind..."
              autoFocus
            />
            <button className="add-btn" onClick={handleMindDump} disabled={!mindDumpText.trim()}>Organize</button>
            {mindDumpResult && (
              <div style={{marginTop:16}}>
                <b>AI Sorted:</b>
                <div className="mind-dump-tags">
                  {mindDumpResult.tags.map((t,i)=>(
                    <span className="mind-dump-tag" key={i}>{t.tag}</span>
                  ))}
                </div>
                <button className="add-btn" style={{marginTop:12}} onClick={handleAddMindDumpTasks}>Add to List</button>
              </div>
            )}
            <button className="remove-btn" style={{marginTop:10}} onClick={()=>setMindDumpOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
      {/* --- Floating Action Bar --- */}
      <div className="action-bar">
        <button className="action-btn" title="Add Task" onClick={()=>setShowAddTaskModal(true)}>
          <span className="action-icon">➕</span>
          <span className="action-label">Add Task</span>
        </button>
        <button className="action-btn" title="Add Recurring Task" onClick={() => setRecurringModalOpen(true)}>
          <span className="action-icon">🔁</span>
          <span className="action-label">Recurring</span>
        </button>
        <button className="action-btn" title="Mind Dump" onClick={()=>setShowMindDumpModal(true)}>
          <span className="action-icon">🧠</span>
          <span className="action-label">Mind Dump</span>
        </button>
        <button className="action-btn" title="Email Me My List" onClick={()=>setShowEmailModal(true)}>
          <span className="action-icon">✉️</span>
          <span className="action-label">Email</span>
        </button>
      </div>
      {/* --- Modals for Add Task, Email, Mind Dump --- */}
      {showAddTaskModal && (
        <div className="modal-bg">
          <div className="modal big-modal fade-in-up">
            <h3>Add a New Task</h3>
            <input
              className="add-input big-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Add a task..."
              onKeyDown={e => e.key === 'Enter' && addTask()}
              autoFocus
            />
            <button className="add-btn" onClick={()=>{addTask();setShowAddTaskModal(false);}}>Add</button>
            <button className="remove-btn" onClick={()=>setShowAddTaskModal(false)}>Cancel</button>
          </div>
        </div>
      )}
      {showEmailModal && (
        <div className="modal-bg">
          <div className="modal big-modal fade-in-up">
            <h3>Email Me My List</h3>
            <input
              className="add-input big-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Your email address"
              autoFocus
            />
            <button className="add-btn" onClick={()=>{handleEmail();setShowEmailModal(false);}} disabled={!email || !tasks.length || emailStatus==='sending'}>
              {emailStatus === 'sending' ? 'Sending...' : emailStatus === 'sent' ? 'Sent!' : emailStatus === 'error' ? 'Error!' : 'Send'}
            </button>
            <button className="remove-btn" onClick={()=>setShowEmailModal(false)}>Cancel</button>
          </div>
        </div>
      )}
      {showMindDumpModal && (
        <div className="modal-bg">
          <div className="modal big-modal fade-in-up">
            <h3>Mind Dump</h3>
            <textarea
              className="mind-dump-textarea big-input"
              value={mindDumpText}
              onChange={e=>setMindDumpText(e.target.value)}
              placeholder="Type anything on your mind..."
              autoFocus
            />
            <button className="add-btn" onClick={()=>{handleMindDump();}}>Organize</button>
            {mindDumpResult && (
              <div style={{marginTop:16}}>
                <b>AI Sorted:</b>
                <div className="mind-dump-tags">
                  {mindDumpResult.tags.map((t,i)=>(
                    <span className="mind-dump-tag" key={i}>{t.tag}</span>
                  ))}
                </div>
                <button className="add-btn" style={{marginTop:12}} onClick={handleAddMindDumpTasks}>Add to List</button>
              </div>
            )}
            <button className="remove-btn" style={{marginTop:10}} onClick={()=>setShowMindDumpModal(false)}>Cancel</button>
          </div>
        </div>
      )}
      {/* --- End Modals --- */}
      <div style={{marginBottom:18,marginTop:8}}>
        <label style={{color:'#ffd700',fontWeight:600,marginRight:8}}>Energy:</label>
        <select value={userState.energy} onChange={e=>setUserState(s=>({...s,energy:e.target.value}))} style={{padding:'4px 10px',borderRadius:6}}>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
        <button className="add-btn" style={{marginLeft:12}} onClick={handleSuggest}>Suggest Task</button>
      </div>
      {/* Mood Row */}
      <div className="mood-row">
        <span className="mood-label">How are you feeling?</span>
        <button className={`mood-btn${mood==='focused'?' selected':''}`} onClick={()=>setMood('focused')} title="Focused" aria-label="Focused">😃</button>
        <button className={`mood-btn${mood==='neutral'?' selected':''}`} onClick={()=>setMood('neutral')} title="Neutral" aria-label="Neutral">😐</button>
        <button className={`mood-btn${mood==='foggy'?' selected':''}`} onClick={()=>setMood('foggy')} title="Foggy" aria-label="Foggy">😵‍💫</button>
        <button className={`mood-btn${mood==='tired'?' selected':''}`} onClick={()=>setMood('tired')} title="Tired" aria-label="Tired">😴</button>
      </div>
      {suggested && (
        <div className="suggested-task fade-in" style={{background:'#232325',borderRadius:10,padding:16,marginBottom:18,boxShadow:'0 2px 12px #ffd70055'}}>
          <b>AI Suggests:</b> <span style={{color:'#ffd700'}}>{suggested.text}</span>
          <div style={{fontSize:'0.95em',color:'#ffe082',marginTop:4}}>
            {userState.energy==='low' ? 'Low energy: try something easy.' : 'Based on your schedule.'}
          </div>
        </div>
      )}
      <div className="shared-row">
        <input className="shared-input" value={sharedEmail} onChange={e=>setSharedEmail(e.target.value)} placeholder="Share with email..." />
        <button className="shared-btn" onClick={()=>handleShareTask(0)} disabled={!sharedEmail.trim()}>Share First Task</button>
      </div>
      {sharedList.length > 0 && (
        <div style={{marginBottom:18}}>
          <b>Shared Tasks:</b>
          {sharedList.map((l,li)=>(
            <div key={li} style={{marginTop:8}}>
              <span style={{color:'#ffd700'}}>{l.email}</span>
              {l.tasks.map((ti,tii)=>(
                <span key={tii} className="nudge-label">{tasks[ti]?.text}
                  <button className="nudge-btn" onClick={()=>handleNudge(l.email, ti)}>{l.nudged?'Nudged!':'Nudge'}</button>
                  <button className="checkin-btn" onClick={()=>handleCheckin(l.email, ti)}>{l.checkin?'Checked In!':'Check-in'}</button>
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Helper: Get Smart Tip for Missed Task ---
function getTipForTask(task) {
  const tips = [
    'Try breaking this task into smaller steps.',
    'Schedule a specific time for this task.',
    'Set a reminder or notification.',
    'Ask someone to help keep you accountable.',
    'Try doing it at a different time of day.'
  ];
  // Pick a tip based on missedCount
  return tips[(task.missedCount || 0) % tips.length];
}

export default App;
