// Settings: reminder time/toggle, install hint, data export, storage status.

import { getAllEntries, clearAllEntries } from '../db.js';
import { dateKey } from '../dates.js';
import { getSetting, setSetting, clearAllSettings } from '../settings.js';
import { createView, escapeHtml, isStandalone, showToast, confirmDialog } from '../ui.js';

const SAMPLE_COUNT = 60;

export async function render() {
  // Load entries up front so the export tap handler stays synchronous:
  // iOS requires navigator.share() to be called directly from the tap.
  const entries = await getAllEntries();
  const enabled = getSetting('reminderEnabled');
  const time = getSetting('reminderTime');

  const node = createView('view-settings', `
    ${isStandalone() ? '' : installHintHTML()}

    <h2 class="section-title">Reminder</h2>
    <div class="card settings-group">
      <label class="setting-row">
        <span class="setting-text">
          <span class="setting-label">Daily reminder</span>
          <span class="setting-help">Shown in the app after this time if you haven’t written today.</span>
        </span>
        <input type="checkbox" class="switch" name="reminderEnabled" ${enabled ? 'checked' : ''}>
      </label>
      <label class="setting-row">
        <span class="setting-label">Reminder time</span>
        <input type="time" class="time-input" name="reminderTime" value="${escapeHtml(time)}" ${enabled ? '' : 'disabled'}>
      </label>
    </div>

    <h2 class="section-title">Your data</h2>
    <div class="card settings-group">
      <div class="setting-stack">
        <span class="setting-help">Entries are stored only on this phone. Export a copy now and then as a backup.</span>
        <button type="button" class="btn btn-secondary" data-export ${entries.length ? '' : 'disabled'}>
          Export ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} (JSON)
        </button>
      </div>
      <div class="setting-row">
        <span class="setting-label">Storage</span>
        <span class="setting-help" data-storage>Checking…</span>
      </div>
    </div>

    <h2 class="section-title">Testing</h2>
    <div class="card settings-group">
      <div class="setting-stack">
        <span class="setting-help">Sample entries fill empty past days only. They never replace a day you’ve written.</span>
        <button type="button" class="btn btn-secondary" data-seed>Add ${SAMPLE_COUNT} sample entries</button>
      </div>
      <div class="setting-stack">
        <span class="setting-help">Deletes every entry (real ones too) and resets all settings.</span>
        <button type="button" class="btn btn-danger-outline" data-clear>Clear all data</button>
      </div>
    </div>
  `);

  const toggle = node.querySelector('[name="reminderEnabled"]');
  const timeInput = node.querySelector('[name="reminderTime"]');

  toggle.addEventListener('change', () => {
    setSetting('reminderEnabled', toggle.checked);
    timeInput.disabled = !toggle.checked;
  });

  timeInput.addEventListener('change', () => {
    if (/^\d{2}:\d{2}$/.test(timeInput.value)) {
      setSetting('reminderTime', timeInput.value);
      showToast('Reminder time saved');
    }
  });

  node.querySelector('[data-export]').addEventListener('click', () => exportEntries(entries));

  const seedBtn = node.querySelector('[data-seed]');
  seedBtn.addEventListener('click', async () => {
    seedBtn.disabled = true;
    try {
      const { seed } = await import('../dev-seed.js');
      const added = await seed(SAMPLE_COUNT);
      showToast(`Added ${added} sample ${added === 1 ? 'entry' : 'entries'}`);
    } catch (err) {
      console.error('Seeding failed', err);
      showToast('Couldn’t add sample entries.');
    }
    document.dispatchEvent(new CustomEvent('rd:rerender'));
  });

  node.querySelector('[data-clear]').addEventListener('click', async () => {
    const confirmed = await confirmDialog({
      title: 'Clear all data?',
      message: `This deletes all ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}, including real ones, and resets your settings. It can’t be undone.`,
      confirmLabel: 'Clear',
      danger: true,
    });
    if (!confirmed) return;
    try {
      await clearAllEntries();
      clearAllSettings();
      showToast('All data cleared');
    } catch (err) {
      console.error('Clear failed', err);
      showToast('Couldn’t clear data.');
    }
    document.dispatchEvent(new CustomEvent('rd:rerender'));
  });

  showStorageStatus(node.querySelector('[data-storage]'));

  return node;
}

function installHintHTML() {
  return `
    <div class="card install-hint">
      <strong>Install rubber-duck</strong>
      <ol>
        <li>Open this page in Safari.</li>
        <li>Tap the <strong>Share</strong> button.</li>
        <li>Choose <strong>Add to Home Screen</strong>.</li>
      </ol>
      <p class="setting-help" style="margin-top:8px">Installed, it works offline and your entries are protected from Safari’s storage clean-up.</p>
    </div>`;
}

function exportEntries(entries) {
  const payload = {
    app: 'rubber-duck',
    format: 1,
    exportedAt: new Date().toISOString(),
    entries,
  };
  const json = JSON.stringify(payload, null, 2);
  const filename = `rubber-duck-${dateKey()}.json`;
  const file = new File([json], filename, { type: 'application/json' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file], title: 'rubber-duck export' }).catch((err) => {
      if (err.name !== 'AbortError') download(file);
    });
  } else {
    download(file);
  }
}

function download(file) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

async function showStorageStatus(el) {
  try {
    const persisted = await navigator.storage?.persisted?.();
    if (persisted) {
      el.innerHTML = '<span class="status-good">Protected</span>';
    } else if (isStandalone()) {
      el.innerHTML = '<span class="status-good">Installed</span>';
    } else {
      el.innerHTML = '<span class="status-warn">May be cleared. Install the app</span>';
    }
  } catch {
    el.textContent = 'Unknown';
  }
}
