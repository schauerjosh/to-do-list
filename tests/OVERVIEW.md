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

## Coverage
- **Report:** Generated in `coverage/` after running unit tests.
- **Goal:** 100% coverage (see `coverage/lcov-report/index.html`)

---

For more, see code comments in each test file.
