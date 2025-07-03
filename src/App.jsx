import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { suggestTask } from './aiPriority';
import { mindDumpSort } from './aiMindDump';
import './App.css';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import EmailIcon from '@mui/icons-material/Email';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';

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
    <Box className="container" ref={containerRef}>
      <Typography variant="h1" className="page-title" gutterBottom>Next-Gen To-Do List</Typography>
      <Box className="progress-bar-bg">
        <Box className="progress-bar" sx={{ width: `${progress}%` }} />
      </Box>
      {/* --- Mood Toaster --- */}
      {showMoodToaster && (
        <Paper elevation={8} className="toaster mood-toaster fade-in-up">
          <Typography className="toaster-title">How are you feeling?</Typography>
          <Box className="toaster-moods">
            <Button className={`mood-btn${mood==='focused'?' selected':''}`} onClick={()=>{setMood('focused');setShowMoodToaster(false);}} title="Focused" aria-label="Focused">😃</Button>
            <Button className={`mood-btn${mood==='neutral'?' selected':''}`} onClick={()=>{setMood('neutral');setShowMoodToaster(false);}} title="Neutral" aria-label="Neutral">😐</Button>
            <Button className={`mood-btn${mood==='foggy'?' selected':''}`} onClick={()=>{setMood('foggy');setShowMoodToaster(false);}} title="Foggy" aria-label="Foggy">😵‍💫</Button>
            <Button className={`mood-btn${mood==='tired'?' selected':''}`} onClick={()=>{setMood('tired');setShowMoodToaster(false);}} title="Tired" aria-label="Tired">😴</Button>
          </Box>
        </Paper>
      )}
      {/* --- End Mood Toaster --- */}
      <Box className="tasks-list">
        {tasks.map((task, i) => (
          <Paper className={`task${task.completed ? ' completed' : ''} ${animStates[i] || ''}`.trim()} key={i} elevation={task.completed ? 2 : 6}>
            <IconButton className="checkbox" aria-label="Toggle task completion" onClick={() => toggleTask(i)} data-testid="checkbox" color={task.completed ? 'primary' : 'default'}>
              {task.completed ? <span className="checkmark">✔</span> : <span className="box" />}
            </IconButton>
            <Typography className="task-title">{task.text}</Typography>
            {/* --- AI Tip --- */}
            <Box className="ai-tip" display="flex" alignItems="center"><LightbulbIcon sx={{mr:1}} fontSize="small" /> {getAiTip(task)}</Box>
            {/* --- AI Idea for Creative Tasks --- */}
            {getAiIdea(task) && (
              <Box className="ai-idea" display="flex" alignItems="center"><EmojiObjectsIcon sx={{mr:1}} fontSize="small" /> AI Idea: {getAiIdea(task)}</Box>
            )}
            {/* --- Progress Slider & Worked On It Button --- */}
            <Box className="progress-row">
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
              <Button className="worked-btn" onClick={() => handleWorkedOnIt(i)} sx={{ml:1}} variant="outlined" color="secondary">Worked on it</Button>
              {task.streak > 0 && (
                <span className="streak-label" title="Momentum!" style={{marginLeft:8, color:'#ffd700', fontWeight:600}}>
                  🔥 {task.streak}d
                </span>
              )}
            </Box>
            {task.recurring && (
              <Typography className="recurring-info" variant="caption">Recurring: {task.recurring.type==='custom'?`Every ${task.recurring.interval} days`:task.recurring.type} | Next: {formatNextDue(task)}</Typography>
            )}
            <IconButton className="remove-btn" onClick={() => removeTask(i)} title="Remove" color="error"><DeleteIcon /></IconButton>
            <Button className="miss-btn" onClick={() => markTaskMissed(i)} title="Mark as Missed" color="warning" variant="text">Missed?</Button>
          </Paper>
        ))}
      </Box>
      {/* Missed Reason Prompt Modal */}
      <Dialog open={missPromptIdx !== null} onClose={()=>setMissPromptIdx(null)}>
        <DialogTitle>Why did you miss this task?</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Reason"
            fullWidth
            variant="outlined"
            value={missReason}
            onChange={e => setMissReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={submitMissReason} disabled={!missReason.trim()} variant="contained" color="primary">Submit</Button>
          <Button onClick={()=>setMissPromptIdx(null)} color="secondary">Cancel</Button>
        </DialogActions>
      </Dialog>
      {/* Recurring Task Modal */}
      <Dialog open={recurringModalOpen} onClose={()=>setRecurringModalOpen(false)}>
        <DialogTitle>Add Recurring Task</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Task description"
            fullWidth
            variant="outlined"
            value={recurringInput.text}
            onChange={e => setRecurringInput(v => ({ ...v, text: e.target.value }))}
          />
          <Box sx={{mt:2, mb:1}}>
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={addRecurringTask} disabled={!recurringInput.text.trim()} variant="contained" color="primary">Add</Button>
          <Button onClick={()=>setRecurringModalOpen(false)} color="secondary">Cancel</Button>
        </DialogActions>
      </Dialog>
      {/* Mind Dump Modal */}
      <Dialog open={mindDumpOpen} onClose={()=>setMindDumpOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Brain Dump</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Type anything on your mind..."
            fullWidth
            multiline
            minRows={3}
            variant="outlined"
            value={mindDumpText}
            onChange={e=>setMindDumpText(e.target.value)}
          />
          {mindDumpResult && (
            <Box sx={{mt:2}}>
              <b>AI Sorted:</b>
              <Box className="mind-dump-tags" sx={{mt:1}}>
                {mindDumpResult.tags.map((t,i)=>(
                  <span className="mind-dump-tag" key={i}>{t.tag}</span>
                ))}
              </Box>
              <Button sx={{mt:2}} onClick={handleAddMindDumpTasks} variant="contained" color="primary">Add to List</Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setMindDumpOpen(false)} color="secondary">Cancel</Button>
        </DialogActions>
      </Dialog>
      {/* --- Floating Action Bar --- */}
      <Box className="action-bar">
        <Button className="action-btn" title="Add Task" onClick={()=>setShowAddTaskModal(true)} startIcon={<AddIcon />} color="primary" variant="contained">
          Add Task
        </Button>
        <Button className="action-btn" title="Add Recurring Task" onClick={() => setRecurringModalOpen(true)} startIcon={<AutorenewIcon />} color="secondary" variant="contained">
          Recurring
        </Button>
        <Button className="action-btn" title="Mind Dump" onClick={()=>setShowMindDumpModal(true)} startIcon={<EmojiObjectsIcon />} color="secondary" variant="contained">
          Mind Dump
        </Button>
        <Button className="action-btn" title="Email Me My List" onClick={()=>setShowEmailModal(true)} startIcon={<EmailIcon />} color="primary" variant="contained">
          Email
        </Button>
      </Box>
      {/* --- Modals for Add Task, Email, Mind Dump --- */}
      <Dialog open={showAddTaskModal} onClose={()=>setShowAddTaskModal(false)}>
        <DialogTitle>Add a New Task</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Add a task..."
            fullWidth
            variant="outlined"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>{addTask();setShowAddTaskModal(false);}} variant="contained" color="primary">Add</Button>
          <Button onClick={()=>setShowAddTaskModal(false)} color="secondary">Cancel</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={showEmailModal} onClose={()=>setShowEmailModal(false)}>
        <DialogTitle>Email Me My List</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Your email address"
            type="email"
            fullWidth
            variant="outlined"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>{handleEmail();setShowEmailModal(false);}} disabled={!email || !tasks.length || emailStatus==='sending'} variant="contained" color="primary">
            {emailStatus === 'sending' ? 'Sending...' : emailStatus === 'sent' ? 'Sent!' : emailStatus === 'error' ? 'Error!' : 'Send'}
          </Button>
          <Button onClick={()=>setShowEmailModal(false)} color="secondary">Cancel</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={showMindDumpModal} onClose={()=>setShowMindDumpModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mind Dump</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Type anything on your mind..."
            fullWidth
            multiline
            minRows={3}
            variant="outlined"
            value={mindDumpText}
            onChange={e=>setMindDumpText(e.target.value)}
          />
          {mindDumpResult && (
            <Box sx={{mt:2}}>
              <b>AI Sorted:</b>
              <Box className="mind-dump-tags" sx={{mt:1}}>
                {mindDumpResult.tags.map((t,i)=>(
                  <span className="mind-dump-tag" key={i}>{t.tag}</span>
                ))}
              </Box>
              <Button sx={{mt:2}} onClick={handleAddMindDumpTasks} variant="contained" color="primary">Add to List</Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setShowMindDumpModal(false)} color="secondary">Cancel</Button>
        </DialogActions>
      </Dialog>
      {/* --- End Modals --- */}
      <Box sx={{marginBottom:3,marginTop:1}}>
        <Typography component="label" sx={{color:'#ffd700',fontWeight:600,marginRight:2}}>Energy:</Typography>
        <TextField
          select
          value={userState.energy}
          onChange={e=>setUserState(s=>({...s,energy:e.target.value}))}
          size="small"
          sx={{minWidth:120, maxWidth:180, borderRadius:2, bgcolor:'#232325'}}
        >
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </TextField>
        <Button sx={{ml:2}} variant="outlined" color="primary" onClick={handleSuggest}>Suggest Task</Button>
      </Box>
      {/* Mood Row */}
      <Box className="mood-row">
        <Typography className="mood-label">How are you feeling?</Typography>
        <Button className={`mood-btn${mood==='focused'?' selected':''}`} onClick={()=>setMood('focused')} title="Focused" aria-label="Focused">😃</Button>
        <Button className={`mood-btn${mood==='neutral'?' selected':''}`} onClick={()=>setMood('neutral')} title="Neutral" aria-label="Neutral">😐</Button>
        <Button className={`mood-btn${mood==='foggy'?' selected':''}`} onClick={()=>setMood('foggy')} title="Foggy" aria-label="Foggy">😵‍💫</Button>
        <Button className={`mood-btn${mood==='tired'?' selected':''}`} onClick={()=>setMood('tired')} title="Tired" aria-label="Tired">😴</Button>
      </Box>
      {suggested && (
        <Paper className="suggested-task fade-in" sx={{background:'#232325',borderRadius:2,p:2,mb:2,boxShadow:'0 2px 12px #ffd70055'}}>
          <b>AI Suggests:</b> <span style={{color:'#ffd700'}}>{suggested.text}</span>
          <Box sx={{fontSize:'0.95em',color:'#ffe082',mt:1}}>
            {userState.energy==='low' ? 'Low energy: try something easy.' : 'Based on your schedule.'}
          </Box>
        </Paper>
      )}
      <Box className="shared-row">
        <TextField className="shared-input" value={sharedEmail} onChange={e=>setSharedEmail(e.target.value)} placeholder="Share with email..." size="small" sx={{mr:1, minWidth:180}} />
        <Button className="shared-btn" onClick={()=>handleShareTask(0)} disabled={!sharedEmail.trim()} variant="outlined" color="primary">Share First Task</Button>
      </Box>
      {sharedList.length > 0 && (
        <Box sx={{mb:2}}>
          <b>Shared Tasks:</b>
          {sharedList.map((l,li)=>(
            <Box key={li} sx={{mt:1}}>
              <span style={{color:'#ffd700'}}>{l.email}</span>
              {l.tasks.map((ti,tii)=>(
                <span key={tii} className="nudge-label">{tasks[ti]?.text}
                  <Button className="nudge-btn" onClick={()=>handleNudge(l.email, ti)} size="small" color="secondary" variant="text">{l.nudged?'Nudged!':'Nudge'}</Button>
                  <Button className="checkin-btn" onClick={()=>handleCheckin(l.email, ti)} size="small" color="secondary" variant="text">{l.checkin?'Checked In!':'Check-in'}</Button>
                </span>
              ))}
            </Box>
          ))}
        </Box>
      )}
    </Box>
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
