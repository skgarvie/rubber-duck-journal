// rubber-duck: app boot, routing, drawer, reminder checks, service worker.

import { createRouter } from './router.js';
import { initReminder, checkReminder, hideBanner } from './reminder.js';
import { getSetting } from './settings.js';
import { dateKey } from './dates.js';
import { showToast, setTopbarColor } from './ui.js';
import * as todayView from './views/today.js';
import * as entriesView from './views/entries.js';
import * as entryDetailView from './views/entry-detail.js';
import * as settingsView from './views/settings.js';
import * as calendarView from './views/calendar.js';

const routes = [
  { name: 'today', nav: 'today', title: 'Today', pattern: /^#\/today$/, view: todayView },
  { name: 'entries', nav: 'entries', title: 'Past entries', pattern: /^#\/entries$/, view: entriesView },
  { name: 'calendar', nav: 'entries', title: 'Past entries', pattern: /^#\/calendar(?:\/(\d{4}-\d{2}))?$/, view: calendarView },
  { name: 'entry', nav: 'entries', title: 'Entry', pattern: /^#\/entries\/(\d{4}-\d{2}-\d{2})$/, view: entryDetailView },
  { name: 'settings', nav: 'settings', title: 'Settings', pattern: /^#\/settings$/, view: settingsView },
];

const viewEl = document.getElementById('view');
const titleEl = document.getElementById('topbar-title');
const menuBtn = document.getElementById('menu-btn');
const drawer = document.getElementById('drawer');
const scrim = document.getElementById('scrim');

let renderToken = 0;
let currentRoute = null;
let todayRenderedFor = null;

// ---------- Rendering ----------

async function onRoute(route, params) {
  const token = ++renderToken;
  closeDrawer();
  currentRoute = route.name;
  titleEl.textContent = route.title;
  document.title = route.name === 'today' ? 'rubber-duck' : `${route.title} · rubber-duck`;

  for (const link of drawer.querySelectorAll('[data-nav]')) {
    if (link.dataset.nav === route.nav) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }

  // Only Today tints the top bar with the mood colour.
  if (route.name !== 'today') {
    hideBanner();
    setTopbarColor(null);
  }

  try {
    const node = await route.view.render(...params);
    if (token !== renderToken) return; // a newer navigation won
    if (route.name !== 'today') setTopbarColor(null); // in case a slower Today render tinted it
    viewEl.replaceChildren(node);
    if (route.name === 'today') todayRenderedFor = dateKey();
    window.scrollTo(0, 0);
  } catch (err) {
    console.error(err);
    if (token === renderToken) {
      viewEl.innerHTML = '<p class="error">Something went wrong loading this screen.</p>';
    }
  }
}

const router = createRouter(routes, onRoute);
document.addEventListener('rd:rerender', () => router.refresh());

// ---------- Drawer ----------

function openDrawer() {
  drawer.classList.add('open');
  scrim.classList.add('open');
  menuBtn.setAttribute('aria-expanded', 'true');
  drawer.querySelector('[aria-current="page"], a')?.focus({ preventScroll: true });
}

function closeDrawer() {
  if (!drawer.classList.contains('open')) return;
  drawer.classList.remove('open');
  scrim.classList.remove('open');
  menuBtn.setAttribute('aria-expanded', 'false');
}

menuBtn.addEventListener('click', () => {
  if (drawer.classList.contains('open')) closeDrawer();
  else openDrawer();
});
scrim.addEventListener('click', closeDrawer);
drawer.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeDrawer(); // also covers tapping the current page
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeDrawer();
});

// ---------- Foreground handling ----------

function hasUnsavedDraft() {
  const draft = getSetting('draft');
  return Boolean(draft && draft.date === todayRenderedFor && (draft.mood || draft.standouts || draft.notes));
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;

  // If the app was left open across midnight, move Today on to the new day,
  // unless there's an unsaved draft for the day still on screen.
  if (currentRoute === 'today' && todayRenderedFor && todayRenderedFor !== dateKey() && !hasUnsavedDraft()) {
    router.refresh().then(() => checkReminder(currentRoute));
    return;
  }
  checkReminder(currentRoute);
});

// ---------- Service worker & storage ----------

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const hadController = Boolean(navigator.serviceWorker.controller);

  navigator.serviceWorker.register('./sw.js').catch((err) => {
    console.warn('Service worker registration failed', err);
  });

  // A new version took over: offer a reload (but not on the very first install).
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return;
    showToast('A new version is ready.', {
      actionLabel: 'Reload',
      onAction: () => location.reload(),
      duration: 0,
    });
  });
}

async function requestPersistentStorage() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist();
    }
  } catch {
    /* not supported */
  }
}

// ---------- Dev: sample data (?seed / ?unseed) ----------

async function handleSeedParams() {
  const params = new URLSearchParams(location.search);
  if (!params.has('seed') && !params.has('unseed')) return;

  try {
    const { seed, unseed } = await import('./dev-seed.js');
    if (params.has('unseed')) {
      const removed = await unseed();
      showToast(`Removed ${removed} sample ${removed === 1 ? 'entry' : 'entries'}`);
    } else {
      const added = await seed(Number(params.get('seed')) || 20);
      showToast(`Added ${added} sample ${added === 1 ? 'entry' : 'entries'}`);
    }
  } catch (err) {
    console.error('Seeding failed', err);
    showToast('Couldn’t load sample data.');
  }
  // Drop the query string so a reload doesn't seed again.
  history.replaceState(null, '', location.pathname + location.hash);
}

// ---------- Boot ----------

async function boot() {
  initReminder();
  registerServiceWorker();
  requestPersistentStorage();
  await handleSeedParams();
  await router.start();
  checkReminder(currentRoute);
}

boot();
