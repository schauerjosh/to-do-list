// This file is Node.js-only and cannot be used in the browser (React app).
// For the GUI, use localStorage or a backend API to sync tasks.json.

// Utility to read/write tasks.json from the root for both CLI and GUI
const fs = require('fs');
const path = require('path');
const DATA_FILE = path.join(__dirname, '../tasks.json');

function loadTasks() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveTasks(tasks) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
}

module.exports = { loadTasks, saveTasks };
