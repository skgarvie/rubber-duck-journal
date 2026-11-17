// Local-date helpers. Never use toISOString() for day keys: it is UTC and
// gives the wrong day in the evening for most timezones.

const pad = (n) => String(n).padStart(2, '0');

/** YYYY-MM-DD for the given date in local time. */
export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isDateKey(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** Parse a YYYY-MM-DD key into a local Date at midnight. */
export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** "Tuesday, 17 November" */
export function formatLong(key) {
  return parseKey(key).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}

/** "Tuesday, 17 November 2026" */
export function formatFull(key) {
  return parseKey(key).toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

/** "Tue, 17 Nov 2026" */
export function formatShort(key) {
  return parseKey(key).toLocaleDateString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

/** "9:41 pm" */
export function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
