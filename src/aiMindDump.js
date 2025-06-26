// AI-assisted mind dump sorting and tagging
// Splits input into lines, tags, and sorts into Today/This Week/Later
export function mindDumpSort(input) {
  const lines = input.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const result = { today: [], week: [], later: [] };
  const tags = [];
  for (const line of lines) {
    let tag = '';
    let text = line;
    if (/\b(today|now|urgent)\b/i.test(line)) {
      result.today.push(line);
      tag = 'Today';
    } else if (/\b(week|soon|friday|monday|tuesday|wednesday|thursday|saturday|sunday)\b/i.test(line)) {
      result.week.push(line);
      tag = 'This Week';
    } else {
      result.later.push(line);
      tag = 'Later';
    }
    tags.push({ text, tag });
  }
  return { ...result, tags };
}
