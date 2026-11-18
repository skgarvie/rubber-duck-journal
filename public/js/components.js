// HTML fragments shared between views. All user text is escaped.

import { MOODS, moodByValue } from './moods.js';
import { escapeHtml } from './ui.js';
import { formatFull, formatShort, formatTime } from './dates.js';

const FALLBACK_MOOD = MOODS[2];

function firstLine(text = '') {
  return text.split('\n').map((l) => l.trim()).find(Boolean) || '';
}

/** A titled section, or nothing at all when the field is empty. */
function section(title, text) {
  if (!text || !text.trim()) return '';
  return `
      <section class="entry-section">
        <h2 class="section-title">${title}</h2>
        <p class="entry-text">${escapeHtml(text)}</p>
      </section>`;
}

/** List / Calendar switcher shown on both past-entry views. */
export function entriesTabsHTML(active) {
  const tab = (name, href, label) =>
    `<a href="${href}" ${active === name ? 'aria-current="page"' : ''}>${label}</a>`;
  return `
    <nav class="segmented" aria-label="Past entries view">
      ${tab('calendar', '#/calendar', 'Calendar')}
      ${tab('list', '#/entries', 'List')}
    </nav>`;
}

// Remember which past-entries view (list or a calendar month) the user came
// from, so the detail view's back link returns there.
const BACK_KEY = 'rubber-duck.entriesBack';

export function rememberEntriesBack(hash) {
  try { sessionStorage.setItem(BACK_KEY, hash); } catch { /* ignore */ }
}

export function entriesBackHash() {
  try {
    const hash = sessionStorage.getItem(BACK_KEY);
    if (hash && /^#\/(entries|calendar(\/\d{4}-\d{2})?)$/.test(hash)) return hash;
  } catch { /* ignore */ }
  return '#/calendar';
}

export function entryCardHTML(entry) {
  const mood = moodByValue(entry.mood) || FALLBACK_MOOD;
  const snippet = firstLine(entry.standouts) || firstLine(entry.notes);
  return `
    <li>
      <a class="entry-card" href="#/entries/${escapeHtml(entry.date)}" style="--mood:${mood.color}">
        <div class="entry-card-top">
          <span class="entry-card-date">${escapeHtml(formatShort(entry.date))}</span>
          <span class="entry-card-mood">${mood.label}</span>
        </div>
        ${snippet ? `<p class="entry-card-snippet">${escapeHtml(snippet)}</p>` : ''}
      </a>
    </li>`;
}

export function entryDetailHTML(entry) {
  const mood = moodByValue(entry.mood) || FALLBACK_MOOD;
  const saved = entry.createdAt ? `Saved at ${escapeHtml(formatTime(entry.createdAt))} · ` : '';
  return `
    <article class="entry-detail" style="--mood:${mood.color}">
      <header class="entry-detail-head">
        <p class="entry-detail-date">${escapeHtml(formatFull(entry.date))}</p>
        <p class="entry-detail-mood">Feeling ${mood.label.toLowerCase()}</p>
      </header>
      ${section('Standouts', entry.standouts)}
      ${section('Notes', entry.notes)}
      <p class="entry-meta">${saved}Locked 🔒</p>
    </article>`;
}
