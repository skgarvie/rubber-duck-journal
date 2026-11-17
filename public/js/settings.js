// Small localStorage-backed settings store. Never throws (private mode etc.).

const PREFIX = 'rubber-duck.';

const DEFAULTS = Object.freeze({
  reminderEnabled: true,
  reminderTime: '21:00',
  draft: null,
});

export function getSetting(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? DEFAULTS[key] : JSON.parse(raw);
  } catch {
    return DEFAULTS[key];
  }
}

export function setSetting(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable: setting just won't persist */
  }
}

export function removeSetting(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}
