// Minimal IndexedDB wrapper. One store, keyed by local date (YYYY-MM-DD),
// which also enforces one entry per day.

const DB_NAME = 'rubber-duck';
const DB_VERSION = 1;
const STORE = 'entries';

let dbPromise = null;

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'date' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        dbPromise = null;
        reject(req.error);
      };
    });
  }
  return dbPromise;
}

function run(mode, operation) {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = operation(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(req.error || tx.error);
    tx.onabort = () => reject(req.error || tx.error);
  }));
}

/**
 * Save a new entry. Uses add() rather than put() so an existing entry for the
 * same date can never be overwritten: entries are locked once saved.
 * Rejects with a DOMException named "ConstraintError" if the date already exists.
 */
export function addEntry(entry) {
  return run('readwrite', (store) => store.add(entry));
}

export function getEntry(date) {
  return run('readonly', (store) => store.get(date));
}

/** Entries between two YYYY-MM-DD keys (inclusive), oldest first. */
export function getEntriesBetween(startKey, endKey) {
  return run('readonly', (store) => store.getAll(IDBKeyRange.bound(startKey, endKey)));
}

/** The date of the oldest entry, or null if there are none. */
export async function getFirstEntryDate() {
  const keys = await run('readonly', (store) => store.getAllKeys(null, 1));
  return keys[0] ?? null;
}

/**
 * Remove sample entries created by the dev seeder (?seed). Only entries
 * flagged `sample: true` are touched; real entries can never be deleted.
 * @returns {Promise<number>} number removed
 */
export async function deleteSampleEntries() {
  const entries = await run('readonly', (store) => store.getAll());
  const samples = entries.filter((e) => e.sample === true);
  if (!samples.length) return 0;
  await run('readwrite', (store) => {
    let last;
    for (const e of samples) last = store.delete(e.date);
    return last;
  });
  return samples.length;
}

/** All entries, newest first. */
export async function getAllEntries() {
  const entries = await run('readonly', (store) => store.getAll());
  return entries.sort((a, b) => b.date.localeCompare(a.date));
}
