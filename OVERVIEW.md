# GUI Directory Overview

This folder contains the React-based web interface for the To-Do List app. It is designed for clarity, maintainability, and ease of onboarding for new developers.

## Key Files & Folders

- `README.md` — Quick start, features, and testing for the GUI.
- `package.json` — Project dependencies and scripts.
- `vite.config.js` — Vite build configuration.
- `babel.config.json` — Babel setup for React 19+ and Jest.
- `jest.config.js` — Jest unit test configuration.
- `playwright.config.js` — Playwright E2E test configuration.
- `public/` — Static assets (e.g., icons).
- `src/` — Main React source code.
- `tests/` — Playwright E2E tests.
- `coverage/` — Test coverage reports (auto-generated).
- `taskStore.js` — (If present) Shared logic for task management.

## Development Workflow

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Run unit tests: `npm test`
4. Run E2E tests: `npm run test:e2e`

See `README.md` for more details.

---

For questions, see the code comments or contact the project maintainer.
