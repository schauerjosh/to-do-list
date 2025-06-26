# Testing Overview

This project uses both unit and end-to-end (E2E) tests to ensure reliability and maintainability.

## Unit Tests
- **Location:** `src/App.test.jsx`
- **Framework:** Jest + React Testing Library
- **Coverage:** All features, edge cases, and async logic (e.g., email mock)
- **Run:**
  ```sh
  npm test
  ```

## E2E Tests
- **Location:** `tests/todo.spec.js`
- **Framework:** Playwright
- **Coverage:** All user flows (add, complete, remove, email, edge cases)
- **Run:**
  ```sh
  npm run test:e2e
  ```

# E2E Test Coverage for Missed & Recurring Tasks

- Tests for marking a task as missed, entering a reason, and verifying it appears in the "Frequently Missed Tasks" section.
- Tests for tips display after missing a task 3+ times.
- Tests for adding recurring tasks (daily, weekly, custom), completing them, and verifying next due date advances and task reappears.

All new features are covered to maintain 95%+ code coverage.

## Coverage
- **Report:** Generated in `coverage/` after running unit tests.
- **Goal:** 100% coverage (see `coverage/lcov-report/index.html`)

---

For more, see code comments in each test file.
