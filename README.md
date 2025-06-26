# To-Do List GUI (React + Vite)

A modern, minimalistic to-do list web app with a beautiful dark theme and metallic gold accents.

## Features
- Add, complete, and remove tasks
- **Progress, Not Perfection Tracking:**
  - % complete slider for each task
  - "Worked on it" button to log partial progress and build momentum
  - 🔥 Streak/momentum indicator for consecutive days of progress
  - Progress and streaks persist across sessions
- AI-powered task suggestions (energy, mood, deadlines)
- Mind Dump: AI sorts your thoughts into Today/This Week/Later
- Goal-connected tasks and progress bars
- Energy & emotion-based planning
- Share tasks for accountability (mocked)
- Progress bar and responsive design
- "Email Me My List" (mocked: logs to console, shows 'Sent!')
- Data stored in browser localStorage
- 100% test coverage (unit + E2E)

## Getting Started

1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the development server:
   ```sh
   npm run dev
   ```
3. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Testing
- **Unit tests:**
  ```sh
  npm test
  ```
- **E2E tests:**
  ```sh
  npm run test:e2e
  ```
- Coverage report: see `coverage/` after running tests.

## Notes
- The "Email Me My List" feature is a demo (no real emails sent).
- All features work offline.
- **Progress Tracking UX:**
  - Use the slider to update % complete for any task.
  - Click "Worked on it" to log effort and build a daily streak (shown as 🔥 2d, etc).
  - Streaks help you focus on progress, not perfection!

---

For CLI usage and more, see the main project README.
