// Calendar: month grid, each day coloured by its mood. Read-only.
// Route: #/calendar (current month) or #/calendar/YYYY-MM.

import { MOODS, moodByValue } from '../moods.js';
import { getEntriesBetween, getFirstEntryDate } from '../db.js';
import { dateKey } from '../dates.js';
import { createView } from '../ui.js';
import { entriesTabsHTML, rememberEntriesBack } from '../components.js';

const pad = (n) => String(n).padStart(2, '0');
const monthKey = (y, m) => `${y}-${pad(m + 1)}`; // m is 0-based

function parseMonth(param) {
  const now = new Date();
  if (param) {
    const [y, m] = param.split('-').map(Number);
    if (y >= 1970 && m >= 1 && m <= 12) return { year: y, month: m - 1 };
  }
  return { year: now.getFullYear(), month: now.getMonth() };
}

function shiftMonth({ year, month }, delta) {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

// Monday-first weekday initials in the user's locale (2024-01-01 was a Monday).
const WEEKDAYS = Array.from({ length: 7 }, (_, i) =>
  new Date(2024, 0, 1 + i).toLocaleDateString(undefined, { weekday: 'narrow' }));

export async function render(param) {
  const now = new Date();
  const todayKey = dateKey(now);
  const current = { year: now.getFullYear(), month: now.getMonth() };

  let shown = parseMonth(param);
  // Never show future months.
  if (shown.year * 12 + shown.month > current.year * 12 + current.month) shown = current;

  const { year, month } = shown;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const first = monthKey(year, month);
  const [entries, firstEntryDate] = await Promise.all([
    getEntriesBetween(`${first}-01`, `${first}-${pad(daysInMonth)}`),
    getFirstEntryDate(),
  ]);
  const byDate = new Map(entries.map((e) => [e.date, e]));

  const prev = shiftMonth(shown, -1);
  const next = shiftMonth(shown, 1);
  const earliest = firstEntryDate ? parseMonth(firstEntryDate.slice(0, 7)) : current;
  const hasPrev = prev.year * 12 + prev.month >= earliest.year * 12 + earliest.month;
  const hasNext = next.year * 12 + next.month <= current.year * 12 + current.month;

  const title = new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first

  let cells = '<li class="cal-blank" aria-hidden="true"></li>'.repeat(leadingBlanks);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${first}-${pad(day)}`;
    const entry = byDate.get(key);
    const classes = ['cal-day'];
    if (key === todayKey) classes.push('is-today');
    if (key > todayKey) classes.push('is-future');

    if (entry) {
      const mood = moodByValue(entry.mood) || MOODS[2];
      cells += `
        <li>
          <a class="${classes.join(' ')} has-entry" href="#/entries/${key}" style="--mood:${mood.color}"
             aria-label="${day} ${title}: ${mood.label}">${day}</a>
        </li>`;
    } else {
      cells += `<li><span class="${classes.join(' ')}" aria-label="${day} ${title}: no entry">${day}</span></li>`;
    }
  }

  const count = entries.length;
  const prevHref = `#/calendar/${monthKey(prev.year, prev.month)}`;
  const nextHref = `#/calendar/${monthKey(next.year, next.month)}`;

  const node = createView('view-calendar', `
    ${entriesTabsHTML('calendar')}
    <section class="card calendar" aria-label="${title}">
      <header class="cal-header">
        ${hasPrev ? `<a class="icon-btn cal-nav" href="${prevHref}" aria-label="Previous month">‹</a>` : '<span class="icon-btn cal-nav" aria-hidden="true"></span>'}
        <h2 class="cal-title">${title}</h2>
        ${hasNext ? `<a class="icon-btn cal-nav" href="${nextHref}" aria-label="Next month">›</a>` : '<span class="icon-btn cal-nav" aria-hidden="true"></span>'}
      </header>
      <ol class="cal-weekdays" aria-hidden="true">${WEEKDAYS.map((d) => `<li>${d}</li>`).join('')}</ol>
      <ol class="cal-grid">${cells}</ol>
      <p class="cal-count">${count === 0 ? 'No entries this month' : count === 1 ? '1 entry this month' : `${count} entries this month`}</p>
    </section>
    <ul class="cal-legend" aria-label="Mood colours">
      ${MOODS.map((m) => `<li><span class="cal-swatch" style="--mood:${m.color}"></span>${m.label}</li>`).join('')}
    </ul>
  `);

  rememberEntriesBack(`#/calendar/${first}`);

  // Swipe left/right to change month.
  const grid = node.querySelector('.calendar');
  let startX = 0;
  let startY = 0;
  grid.addEventListener('touchstart', (e) => {
    startX = e.changedTouches[0].clientX;
    startY = e.changedTouches[0].clientY;
  }, { passive: true });
  grid.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) < 50 || Math.abs(dy) > 40) return;
    if (dx < 0 && hasNext) location.hash = nextHref;
    if (dx > 0 && hasPrev) location.hash = prevHref;
  }, { passive: true });

  return node;
}
