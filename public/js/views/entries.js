// Past entries: colour-coded, newest first, read-only.

import { getAllEntries } from '../db.js';
import { createView } from '../ui.js';
import { entryCardHTML, entriesTabsHTML, rememberEntriesBack } from '../components.js';

export async function render() {
  const entries = await getAllEntries();
  rememberEntriesBack('#/entries');

  if (!entries.length) {
    return createView('view-entries', `
      ${entriesTabsHTML('list')}
      <div class="empty">
        <div class="empty-duck" aria-hidden="true">🦆</div>
        <p class="empty-title">No entries yet</p>
        <p>Your saved days will show up here, coloured by mood.</p>
        <a class="btn btn-primary" href="#/today">Write today’s entry</a>
      </div>
    `);
  }

  const count = entries.length === 1 ? '1 entry' : `${entries.length} entries`;
  return createView('view-entries', `
    ${entriesTabsHTML('list')}
    <p class="entry-count">${count}</p>
    <ul class="entry-list">
      ${entries.map(entryCardHTML).join('')}
    </ul>
  `);
}
