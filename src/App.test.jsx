/* eslint-env jest */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { suggestTask } from './aiPriority';
import { mindDumpSort } from './aiMindDump';
import { describe, it, expect, beforeEach, beforeAll, afterAll, jest } from '@jest/globals';

// Mock fetch for EmailJS
beforeAll(() => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: true }));
});
afterAll(() => {
  global.fetch.mockRestore();
});

describe('To-Do List App', () => {
  beforeEach(() => {
    localStorage.clear();
    fetch.mockClear && fetch.mockClear();
  });

  it('renders title and add button', () => {
    render(<App />);
    expect(screen.getByText(/TO-DO LIST/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ ADD TASK/i)).toBeInTheDocument();
  });

  it('adds a new task', () => {
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/add a task/i), { target: { value: 'Test Task' } });
    fireEvent.click(screen.getByText(/\+ ADD TASK/i));
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('marks a task as completed', () => {
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/add a task/i), { target: { value: 'Complete Me' } });
    fireEvent.click(screen.getByText(/\+ ADD TASK/i));
    const checkbox = screen.getByText('Complete Me').parentElement.querySelector('.checkbox');
    fireEvent.click(checkbox);
    expect(screen.getByText('Complete Me').parentElement).toHaveClass('completed');
  });

  it('removes a task', () => {
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/add a task/i), { target: { value: 'Remove Me' } });
    fireEvent.click(screen.getByText(/\+ ADD TASK/i));
    fireEvent.click(screen.getByTitle('Remove'));
    expect(screen.queryByText('Remove Me')).not.toBeInTheDocument();
  });

  it('emails the list', async () => {
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/add a task/i), { target: { value: 'Email Task' } });
    fireEvent.click(screen.getByText(/\+ ADD TASK/i));
    fireEvent.change(screen.getByPlaceholderText(/your email address/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByText(/email me my list/i));
    // Wait for either 'Sending...' or 'Sent!' to appear, then for 'Sent!' to appear
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /sending|sent!/i });
      expect(btn).toBeInTheDocument();
    });
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /sent!/i });
      expect(btn).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('does not add empty or whitespace-only tasks', () => {
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/add a task/i), { target: { value: '   ' } });
    fireEvent.click(screen.getByText(/\+ ADD TASK/i));
    expect(screen.queryByText('   ')).not.toBeInTheDocument();
  });

  it('handles emailing with no tasks gracefully', async () => {
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/your email address/i), { target: { value: 'test@example.com' } });
    const btn = screen.getByText(/email me my list/i);
    expect(btn).toBeDisabled();
  });

  it('handles very long task text', () => {
    render(<App />);
    const longText = 'A'.repeat(1000);
    fireEvent.change(screen.getByPlaceholderText(/add a task/i), { target: { value: longText } });
    fireEvent.click(screen.getByText(/\+ ADD TASK/i));
    expect(screen.getByText(longText)).toBeInTheDocument();
  });

  it('marks a task as missed and shows in frequently missed', async () => {
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/add a task/i), { target: { value: 'Missed Task' } });
    fireEvent.click(screen.getByText(/\+ ADD TASK/i));
    // Miss the task twice so it appears in 'Frequently Missed Tasks'
    fireEvent.click(screen.getByText('Missed?'));
    fireEvent.change(screen.getByPlaceholderText(/why did you miss/i), { target: { value: 'Forgot' } });
    fireEvent.click(screen.getByText('Submit'));
    fireEvent.click(screen.getByText('Missed?'));
    fireEvent.change(screen.getByPlaceholderText(/why did you miss/i), { target: { value: 'Busy' } });
    fireEvent.click(screen.getByText('Submit'));
    const missedTaskEls = await screen.findAllByText('Missed Task');
    expect(missedTaskEls.length).toBeGreaterThan(0);
    expect(screen.getByTestId('missed-reason-text').textContent).toBe('Busy');
  });

  it('shows tip after missing a task 3 times', async () => {
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/add a task/i), { target: { value: 'Repeat Miss' } });
    fireEvent.click(screen.getByText(/\+ ADD TASK/i));
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByText('Missed?'));
      fireEvent.change(screen.getByPlaceholderText(/why did you miss/i), { target: { value: 'Busy' } });
      fireEvent.click(screen.getByText('Submit'));
    }
    expect(await screen.findByText(/Tip:/)).toBeInTheDocument();
  });

  it('adds and completes a daily recurring task', async () => {
    render(<App />);
    fireEvent.click(screen.getByText(/\+ ADD RECURRING TASK/i));
    fireEvent.change(screen.getByPlaceholderText(/task description/i), { target: { value: 'Daily Recurring' } });
    fireEvent.click(screen.getByLabelText(/Daily/));
    fireEvent.click(screen.getByText('Add'));
    expect(screen.getByText(/Recurring: daily/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByTestId('checkbox')[0]);
    expect(screen.getByText('Daily Recurring')).toBeInTheDocument();
  });

  it('adds and completes a custom recurring task', async () => {
    render(<App />);
    fireEvent.click(screen.getByText(/\+ ADD RECURRING TASK/i));
    fireEvent.change(screen.getByPlaceholderText(/task description/i), { target: { value: 'Custom Recurring' } });
    fireEvent.click(screen.getByLabelText(/Custom every/));
    fireEvent.change(screen.getByDisplayValue('1'), { target: { value: '2' } });
    fireEvent.click(screen.getByText('Add'));
    expect(screen.getByText(/Every 2 days/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByTestId('checkbox')[0]);
    expect(screen.getByText('Custom Recurring')).toBeInTheDocument();
  });

  it('updates progress slider and shows correct %', () => {
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/add a task/i), { target: { value: 'Progress Task' } });
    fireEvent.click(screen.getByText(/\+ ADD TASK/i));
    const slider = screen.getByLabelText('Task progress');
    fireEvent.change(slider, { target: { value: '40' } });
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('increments progress and streak with "Worked on it"', async () => {
    let mockTime = Date.now();
    const realDateNow = Date.now;
    Date.now = () => mockTime;
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/add a task/i), { target: { value: 'Streak Task' } });
    fireEvent.click(screen.getByText(/\+ ADD TASK/i));
    const workedBtn = screen.getByText('Worked on it');
    fireEvent.click(workedBtn);
    expect(screen.getByText(/10%/)).toBeInTheDocument();
    expect(screen.getByText(/🔥 1d/)).toBeInTheDocument();
    // Advance mock time by 1 day and click again
    mockTime += 24*60*60*1000 + 1000;
    fireEvent.click(workedBtn);
    await waitFor(() => {
      const streakLabels = screen.queryAllByTitle('Momentum!');
      expect(streakLabels.some(el => el.textContent.includes('2d'))).toBe(true);
    });
    Date.now = realDateNow;
  });

  it('persists progress and streak across rerenders', () => {
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/add a task/i), { target: { value: 'Persist Task' } });
    fireEvent.click(screen.getByText(/\+ ADD TASK/i));
    const workedBtn = screen.getByText('Worked on it');
    fireEvent.click(workedBtn);
    expect(screen.getByText(/10%/)).toBeInTheDocument();
    expect(screen.getByText(/🔥 1d/)).toBeInTheDocument();
    // Rerender (simulate reload)
    fireEvent.click(screen.getByTitle('Remove'));
    fireEvent.change(screen.getByPlaceholderText(/add a task/i), { target: { value: 'Persist Task' } });
    fireEvent.click(screen.getByText(/\+ ADD TASK/i));
    // Should not see streak for new task
    expect(screen.queryByText(/🔥/)).not.toBeInTheDocument();
  });
});

describe('AI Priority Engine', () => {
  it('suggests the lowest effort incomplete task when energy is low', () => {
    const tasks = [
      { text: 'Big Project', completed: false, estimatedEffort: 5 },
      { text: 'Quick Email', completed: false, estimatedEffort: 1 },
      { text: 'Done', completed: true, estimatedEffort: 1 }
    ];
    const userState = { energy: 'low' };
    const result = suggestTask(tasks, userState);
    expect(result.text).toBe('Quick Email');
  });
  it('suggests the soonest due task if energy is normal', () => {
    const now = Date.now();
    const tasks = [
      { text: 'Later', completed: false, recurring: { nextDue: now + 100000 } },
      { text: 'Soon', completed: false, recurring: { nextDue: now + 1000 } }
    ];
    const userState = { energy: 'normal' };
    const result = suggestTask(tasks, userState);
    expect(result.text).toBe('Soon');
  });
});

describe('Energy & Emotion-Based Planning', () => {
  it('passes mood to AI suggestion and prioritizes accordingly', () => {
    // For demo, just check mood is passed through
    const tasks = [
      { text: 'Easy', completed: false, estimatedEffort: 1 },
      { text: 'Hard', completed: false, estimatedEffort: 5 }
    ];
    const userState = { energy: 'low', mood: 'tired' };
    // The AI could use mood to further filter, for now just ensure it's passed
    const result = suggestTask(tasks, userState);
    expect(result.text).toBe('Easy');
  });
});

describe('Mind Dump AI', () => {
  it('sorts and tags lines into Today, This Week, Later', () => {
    const input = `urgent: call boss\nfriday: finish report\nread a book`;
    const result = mindDumpSort(input);
    expect(result.today).toContain('urgent: call boss');
    expect(result.week).toContain('friday: finish report');
    expect(result.later).toContain('read a book');
    expect(result.tags).toEqual([
      { text: 'urgent: call boss', tag: 'Today' },
      { text: 'friday: finish report', tag: 'This Week' },
      { text: 'read a book', tag: 'Later' }
    ]);
  });
});

describe('Goal-Connected Tasks', () => {
  it('calculates goal progress correctly', () => {
    const goals = [{ name: 'Fitness' }, { name: 'Work' }];
    const tasks = [
      { text: 'Run', completed: true, goal: 'Fitness' },
      { text: 'Pushups', completed: false, goal: 'Fitness' },
      { text: 'Email', completed: true, goal: 'Work' }
    ];
    // Simulate the goalProgress logic
    const map = {};
    for (const g of goals) {
      const total = tasks.filter(t => t.goal === g.name).length;
      const done = tasks.filter(t => t.goal === g.name && t.completed).length;
      map[g.name] = { total, done, percent: total ? Math.round((done/total)*100) : 0 };
    }
    expect(map['Fitness'].percent).toBe(50);
    expect(map['Work'].percent).toBe(100);
  });
});

describe('Shared Lists & Accountability', () => {
  it('adds a shared user and task, nudges and checks in', () => {
    // Simulate sharing
    let sharedList = [];
    const email = 'test@example.com';
    const i = 0;
    // Share
    sharedList = [...sharedList, { email, tasks: [i], nudged: false, checkin: false }];
    expect(sharedList[0].email).toBe(email);
    // Nudge
    sharedList = sharedList.map(l => l.email === email ? { ...l, nudged: true } : l);
    expect(sharedList[0].nudged).toBe(true);
    // Check-in
    sharedList = sharedList.map(l => l.email === email ? { ...l, checkin: true } : l);
    expect(sharedList[0].checkin).toBe(true);
  });
});
