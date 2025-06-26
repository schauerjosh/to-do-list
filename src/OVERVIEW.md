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

---

For details, see code comments in each file. New contributors should start with `App.jsx`.
