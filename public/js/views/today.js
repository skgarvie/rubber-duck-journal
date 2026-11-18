// Today: capture form, or today's locked entry if already saved.

import { MOODS, moodByValue } from '../moods.js';
import { addEntry, getEntry, deleteEntry } from '../db.js';
import { dateKey, formatLong } from '../dates.js';
import { getSetting, setSetting, removeSetting } from '../settings.js';
import { createView, confirmDialog, showToast, setTopbarColor } from '../ui.js';
import { entryDetailHTML } from '../components.js';
import { hideReminder } from '../reminder.js';

export async function render() {
  const date = dateKey();
  const existing = await getEntry(date);

  if (existing) {
    setTopbarColor(moodByValue(existing.mood)?.color || null);
    const node = createView('view-today', `
      <div class="done-hero">
        <span class="done-duck" aria-hidden="true">🦆</span>
        <p class="done-title">Done for today</p>
        <p class="done-sub">The duck has heard all about it. See you tomorrow.</p>
      </div>
      ${entryDetailHTML(existing)}
      <button type="button" class="btn btn-danger-outline test-delete" data-test-delete>TEST: DELETE ENTRY</button>
    `);
    wireTestDelete(node, date);
    return node;
  }

  const node = createView('view-today', formTemplate(date));
  wireForm(node, date);
  return node;
}

function formTemplate(date) {
  const options = MOODS.map((m) => `<option value="${m.value}">${m.label}</option>`).join('');
  return `
    <form class="card entry-form" id="entry-form" novalidate autocomplete="off">
      <div>
        <p class="date-heading">${formatLong(date)}</p>
        <p class="date-sub">How did today go?</p>
      </div>

      <label class="field">
        <span class="field-label">Mood</span>
        <select name="mood" required>
          <option value="" disabled selected>Pick a mood…</option>
          ${options}
        </select>
      </label>

      <label class="field">
        <span class="field-label">Notes</span>
        <textarea name="notes" rows="6" placeholder="How did the day go?"></textarea>
      </label>

      <label class="field">
        <span class="field-label">Standouts</span>
        <textarea name="standouts" rows="3" placeholder="What stood out today?"></textarea>
      </label>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" data-save disabled>Save entry</button>
        <p class="form-hint" data-hint>Pick a mood to save.</p>
      </div>
    </form>`;
}

function wireForm(node, date) {
  const form = node.querySelector('form');
  const { mood, standouts, notes } = form.elements;
  const saveBtn = form.querySelector('[data-save]');
  const hint = form.querySelector('[data-hint]');

  // Restore an unsaved draft for this day; drop drafts from other days.
  const draft = getSetting('draft');
  if (draft && draft.date === date) {
    if (moodByValue(draft.mood)) mood.value = String(draft.mood);
    standouts.value = draft.standouts || '';
    notes.value = draft.notes || '';
  } else if (draft) {
    removeSetting('draft');
  }

  function syncMood() {
    const selected = moodByValue(mood.value);
    if (selected) {
      form.style.setProperty('--accent', selected.color);
    } else {
      form.style.removeProperty('--accent');
    }
    setTopbarColor(selected ? selected.color : null);
    form.classList.toggle('has-mood', Boolean(selected));
    saveBtn.disabled = !selected;
    hint.textContent = selected ? 'Entries are locked once saved.' : 'Pick a mood to save.';
  }

  function saveDraft() {
    setSetting('draft', { date, mood: mood.value, standouts: standouts.value, notes: notes.value });
  }

  syncMood();
  form.addEventListener('input', () => { syncMood(); saveDraft(); });
  form.addEventListener('change', () => { syncMood(); saveDraft(); });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const selected = moodByValue(mood.value);
    if (!selected) return;

    const confirmed = await confirmDialog({
      title: 'Save today’s entry?',
      message: 'Once saved, this entry is locked and can’t be edited.',
      confirmLabel: 'Save',
    });
    if (!confirmed) return;

    saveBtn.disabled = true;
    try {
      await addEntry({
        date,
        mood: selected.value,
        standouts: standouts.value.trim(),
        notes: notes.value.trim(),
        createdAt: Date.now(),
      });
      removeSetting('draft');
      hideReminder();
      showToast('Saved. Thanks for telling the duck 🦆');
    } catch (err) {
      if (err?.name === 'ConstraintError') {
        removeSetting('draft');
        showToast('An entry for this day already exists.');
      } else {
        console.error('Save failed', err);
        showToast('Couldn’t save. Please try again.');
        saveBtn.disabled = false;
        return;
      }
    }
    document.dispatchEvent(new CustomEvent('rd:rerender'));
  });
}

// Testing only: delete today's entry so the form can be tried again.
function wireTestDelete(node, date) {
  node.querySelector('[data-test-delete]').addEventListener('click', async () => {
    const confirmed = await confirmDialog({
      title: 'Delete today’s entry?',
      message: 'This is a testing tool. Today’s entry will be permanently deleted.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!confirmed) return;
    await deleteEntry(date);
    showToast('Today’s entry deleted.');
    document.dispatchEvent(new CustomEvent('rd:rerender'));
  });
}
