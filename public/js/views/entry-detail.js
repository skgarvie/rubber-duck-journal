// Single entry, read-only.

import { getEntry } from '../db.js';
import { createView } from '../ui.js';
import { entryDetailHTML, entriesBackHash } from '../components.js';

export async function render(date) {
  const entry = await getEntry(date);
  const backHash = entriesBackHash();
  const backLabel = backHash.startsWith('#/calendar') ? 'Calendar' : 'Past entries';
  const back = `<a class="back-link" href="${backHash}">‹ ${backLabel}</a>`;

  if (!entry) {
    return createView('view-entry', `
      ${back}
      <div class="empty">
        <div class="empty-duck" aria-hidden="true">🦆</div>
        <p class="empty-title">No entry for this day</p>
      </div>
    `);
  }

  return createView('view-entry', `${back}${entryDetailHTML(entry)}`);
}
