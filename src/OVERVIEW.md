# Source Code Overview (`src/`)

This folder contains all React source code for the To-Do List GUI.

## Main Files
- `App.jsx` — Main React component. Handles UI, state, and all app logic. Well-commented and modular.
- `App.css` — Modern dark theme with metallic gold accents. Responsive and accessible.
- `App.test.jsx` — Unit tests for all features and edge cases using React Testing Library.
- `main.jsx` — Entry point for the React app.
- `index.css` — Global styles.
- `assets/` — Static assets (e.g., SVGs).

## Key Concepts
- **State Management:** Uses React hooks (`useState`, `useEffect`, `useCallback`, `useMemo`).
- **Persistence:** Tasks are saved in `localStorage`.
- **Testing:** 100% coverage goal. All logic and UI states are tested.
- **Email Feature:** "Email Me My List" is mocked for demo (see `App.jsx`).

# New Features: Missed & Recurring Tasks

## Missed/Skipped Tasks
- Mark any task as "Missed?" and provide a reason (modal prompt).
- Frequently missed tasks (2+ times) are highlighted in a special section.
- If a task is missed 3+ times, actionable tips are shown to help you succeed next time.
- All missed/completed events are tracked in each task's history.

## Recurring Tasks
- Add recurring tasks (daily, weekly, or custom interval) via the "+ ADD RECURRING TASK" button.
- Recurring tasks display their next due date and recurrence pattern.
- When completed, the next due date is automatically advanced.
- When the next due date arrives, the task reappears as active.

## UI/UX
- Modern, animated modals and gold-accented UI for all new features.
- All new controls are keyboard accessible and responsive.

---

For details, see code comments in each file. New contributors should start with `App.jsx`. For implementation details of new features, see code comments in `App.jsx`. For styling, see `App.css`.
