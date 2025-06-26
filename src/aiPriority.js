// AI-powered priority engine for suggesting the best task to do now.
// Used by App.jsx and tested in App.test.jsx
export function suggestTask(tasks, userState) {
  const now = Date.now();
  let filtered = tasks.filter(t => !t.completed);
  if (userState.energy === 'low') {
    filtered = filtered.filter(t => (t.estimatedEffort || 1) <= 2);
  }
  filtered = filtered.sort((a, b) => {
    const aDue = a.recurring ? a.recurring.nextDue : now + 99999999;
    const bDue = b.recurring ? b.recurring.nextDue : now + 99999999;
    return aDue - bDue;
  });
  return filtered[0] || null;
}
