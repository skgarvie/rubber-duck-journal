// In-app reminder. Shown on launch / return to foreground when:
//   1. reminders are enabled,
//   2. the local time is at or after the reminder time, and
//   3. there is no saved entry for today.
// "Later" just closes it; nothing is stored, so it returns next time the app opens.

import { getSetting } from './settings.js';
import { getEntry } from './db.js';
import { dateKey } from './dates.js';

let sheet;
let banner;

export function initReminder() {
  sheet = document.getElementById('reminder-sheet');
  banner = document.getElementById('reminder-banner');

  sheet.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'write') {
      sheet.close();
      location.hash = '#/today';
    } else if (action === 'later') {
      sheet.close();
    } else if (event.target === sheet) {
      sheet.close(); // tap on backdrop
    }
  });
}

export function isPastReminderTime(now = new Date()) {
  const match = /^(\d{2}):(\d{2})$/.exec(getSetting('reminderTime') || '');
  if (!match) return false;
  const reminderMinutes = Number(match[1]) * 60 + Number(match[2]);
  return now.getHours() * 60 + now.getMinutes() >= reminderMinutes;
}

export async function shouldRemind(now = new Date()) {
  if (!getSetting('reminderEnabled')) return false;
  if (!isPastReminderTime(now)) return false;
  const entry = await getEntry(dateKey(now));
  return !entry;
}

/**
 * Check and show the reminder if needed.
 * On the Today screen the form is already visible, so a slim banner is shown
 * instead of the bottom sheet.
 */
export async function checkReminder(routeName) {
  let remind = false;
  try {
    remind = await shouldRemind();
  } catch (err) {
    console.error('Reminder check failed', err);
  }

  if (!remind) {
    hideReminder();
    return;
  }

  if (routeName === 'today') {
    banner.hidden = false;
  } else if (!sheet.open) {
    sheet.showModal();
  }
}

export function hideBanner() {
  if (banner) banner.hidden = true;
}

export function hideReminder() {
  hideBanner();
  if (sheet?.open) sheet.close();
}
