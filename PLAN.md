# rubber-duck — PWA Journal Plan

A small, offline-first journaling PWA. You answer one short prompt a day: a mood, the standouts, and notes. Built with plain HTML, CSS and JavaScript (ES modules, no framework, no build step), tuned for an iPhone 12 mini in portrait. It is hosted on **GitHub Pages**.

---

## 1. Goals & constraints

| Item | Decision |
|---|---|
| Target device | iPhone 12 mini: 375×812 CSS px viewport, DPR 3, notch, home indicator |
| Orientation | Portrait only |
| Stack | Vanilla JS (ES modules), HTML, CSS. No framework, no bundler |
| Hosting | GitHub Pages (static files only, no backend) |
| Data | Stored on the device only (IndexedDB). No accounts, no server |
| Offline | Works fully offline after the first load |
| Reminders | In-app pop-up only for v1. Push notifications are on the roadmap (§8), via GitHub Actions cron + Web Push to keep everything on GitHub |

---

## 2. Features

### 2.1 Today (capture form) is the default screen
- Header shows the date, e.g. "Tuesday, 17 November".
- **Mood**: a `<select>` with 5 options:

  | Value | Label | Colour |
  |---|---|---|
  | 1 | Terrible | `#0b0b0f` (black) |
  | 2 | Bad | `#1e2a6b` (deep blue) |
  | 3 | Okay | `#2563eb` (blue) |
  | 4 | Good | `#0d7f74` (teal, blue→green) |
  | 5 | Fantastic | `#15803d` (green) |

  Good and Fantastic were darkened during the build so white text on them passes the WCAG 4.5:1 contrast ratio.

  The form's accent colour and the **top bar** update live to match the selected mood. Once today is saved, the top bar keeps the saved mood's colour. Other screens use the default top bar.
- **Notes**: a `<textarea>` (longer, ~6 rows) for free-form notes.
- **Standouts**: a `<textarea>` (short, ~3 rows) for the highlights of the day. It sits below Notes on the form.
- **Save** button. It is disabled until a mood is picked. Text fields are optional. Tapping Save shows a confirmation ("Save? You won't be able to edit this entry.") because the entry is locked once saved.
- **One entry per calendar day, locked as soon as it is saved.** If today already has an entry, the Today screen shows it read-only with a "Done for today 🦆" message.
- The draft autosaves to `localStorage` while typing, so an accidental close doesn't lose text. The draft is cleared on save.

### 2.2 Past entries (read-only)
- Reached from the menu, which opens the **Calendar** by default. A **Calendar / List** switcher at the top toggles between the two views.
- **List** (`#/entries`): a reverse-chronological list of cards. Each card's **background is the mood colour** (white text on all five, checked for contrast) and shows the date, mood label and the first line of the standouts.
- **Calendar** (`#/calendar/YYYY-MM`): a Monday-first month grid on a slate-navy card (`#3a4a6a`) with light text. The card stays the same colour in dark mode too, so every mood colour, including black, stands out.
  - Days with an entry are filled with the mood colour and link to that entry. Empty days are outlined only.
  - Today is ringed and future days are dimmed.
  - Change month with the ‹ › buttons or by swiping. It stops at the month of the earliest entry and never goes past the current month.
  - Below the grid: an entry count for the month and a mood colour legend.
- Tapping a card or a day opens a read-only detail view with the full standouts and notes. Empty fields are left out of both the cards and the detail view. There are no edit or delete controls. The back link returns to wherever you came from (the list, or the same calendar month).
- **Testing tools** (Settings → Testing):
  - **Add 60 sample entries**: fills empty past days only.
  - **Clear all data**: deletes every entry (real ones too) and resets all settings, behind a red confirmation.
- **Sample data via URL:**
  - Open the app with `?seed` (or `?seed=N`) to add 20 (or N) sample entries to empty past days, with a few gaps left in.
  - Open it with `?unseed` to remove them.
  - Sample entries are flagged `sample: true`, so real entries are never overwritten or removed.
  - `js/dev-seed.js` is loaded on demand and is included in the offline cache, so the Testing button works offline.

### 2.3 In-app reminder
- **Reminder time** is set in Settings (`<input type="time">`, default 21:00).
- The app checks when it launches and whenever it comes back to the foreground (`visibilitychange` → `visible`). It shows a reminder when:
  1. the current local time is at or after the reminder time, **and**
  2. there is **no saved entry for today**.
- The reminder is a bottom-sheet pop-up: "How was your day? Tell the duck 🦆" with two buttons:
  - **Write entry** goes to `#/today`.
  - **Later** just closes the sheet. Nothing is saved, so the reminder shows again the next time the app is opened or brought back to the foreground.
- If the user is already on the Today screen with an unsaved draft, show a slim banner instead of the sheet.
- If an entry for today has been submitted, the reminder never appears.
- This only works when the user opens the app. Background notifications come with push (§8).

### 2.4 Settings
- **Reminder time** and an on/off toggle for the in-app reminder.
- **Export data**: downloads all entries as JSON. This is a strong recommendation because the data only lives on the device. **Import** (merge by date, skipping dates that already exist) is optional.
- An "Add to Home Screen" hint (Share → Add to Home Screen) when not installed (`navigator.standalone !== true`).

### 2.5 Navigation / menu
- A hamburger button in the top-left opens a slide-in drawer with Today, Past entries and Settings.
- Routing is hash-based (`#/today`, `#/entries`, `#/entries/2026-11-17`, `#/settings`). This works on static hosting with no rewrite rules, and the back gesture works.

---

## 3. iPhone 12 mini / iOS specifics

- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
- Pad the header and footer with `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` for the notch and home indicator.
- `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style: black-translucent`, and a 180×180 `apple-touch-icon`.
- Use 16px or larger font sizes on inputs so iOS doesn't zoom on focus.
- Tap targets should be at least 44×44 pt.
- Use `100dvh` rather than `100vh` so the layout stays correct when the keyboard opens. Keep the Save button reachable when the keyboard is up, for example a sticky footer or scrolling the field into view.
- **Portrait lock**: set `"orientation": "portrait"` in the manifest. iOS doesn't reliably honour it, so also add a CSS fallback: `@media (orientation: landscape) { … }` shows a full-screen "Please rotate to portrait" overlay.
- System font stack (`-apple-system, …`). Support dark mode via `prefers-color-scheme`.
- **Storage eviction**: Safari can clear storage for sites that aren't used, but installed home-screen PWAs are exempt. Call `navigator.storage.persist()` on first run, and keep the export feature as a backup.

---

## 4. GitHub Pages specifics

- All app files live in `public/`. A GitHub Actions workflow (`.github/workflows/pages.yml`) uploads that folder as the Pages site, so `public/` becomes the site root. There is no build step.
- One-time setup: repo **Settings → Pages → Source: GitHub Actions**. "Deploy from a branch" can only publish the repo root or `/docs`, so it isn't used.
- The site is served from a **sub-path** (`https://<user>.github.io/rubber-duck-journal/`), so:
  - Use **relative URLs everywhere** (`./css/app.css`, `./sw.js`), never ones starting with `/`.
  - Manifest: `"start_url": "./"`, `"scope": "./"`.
  - Register the service worker with `navigator.serviceWorker.register('./sw.js')`. Its scope then defaults to the sub-path.
  - Precache list in `sw.js` uses relative paths.
- HTTPS is provided by GitHub Pages, which service workers and installation require.
- Uploading through Actions skips Jekyll processing, so no `.nojekyll` file is needed.
- Moving to another host later won't change the app: it's just static files with relative paths.

---

## 5. Architecture

```
rubber-duck-journal/
├── .github/workflows/pages.yml
├── PLAN.md
└── public/
    ├── index.html              # app shell: header, drawer, <main id="view">, reminder sheet
    ├── manifest.webmanifest    # name, icons, display: standalone, orientation: portrait, relative start_url/scope
    ├── sw.js                   # service worker: precache shell, cache-first offline
    ├── css/
    │   └── app.css             # tokens (mood colours, spacing), layout, components
    ├── js/
    │   ├── app.js              # boot: register SW, router, drawer, reminder check
    │   ├── router.js           # hash router → view render functions
    │   ├── db.js               # IndexedDB wrapper (open, put, get, getAll)
    │   ├── moods.js            # mood scale: value, label, colour
    │   ├── settings.js         # localStorage-backed settings
    │   ├── reminder.js         # shouldRemind() logic + bottom-sheet UI
    │   ├── dev-seed.js         # sample data (Settings → Testing, ?seed / ?unseed)
    │   └── views/
    │       ├── today.js
    │       ├── entries.js
    │       ├── calendar.js
    │       ├── entry-detail.js
    │       └── settings.js
    └── icons/                  # 180, 192, 512 png + maskable
```

### Data model (IndexedDB `rubber-duck`, store `entries`, keyPath `date`)
```js
{
  date: "2026-11-17",     // local date, YYYY-MM-DD (also enforces one per day)
  mood: 4,                // 1–5
  standouts: "…",
  notes: "…",
  createdAt: 1763370000000
}
```
- Save uses `store.add()` rather than `put()`. That way, if an entry for the date already exists, the write fails, which enforces the lock at the data layer as well as in the UI.
- The local date is built from `getFullYear/getMonth/getDate`, never `toISOString()`, which is UTC and would give the wrong day late in the evening.

### Settings (`localStorage`)
`reminderEnabled` (default true), `reminderTime` (default `"21:00"`), `draft`.

### Service worker
- Cache-first precache of the app shell, with a versioned cache name. Bump the version on each release. On `activate`, delete old caches.
- Optional: an "Update available, tap to reload" toast when a new SW is waiting.

---

## 6. Milestones

1. **Shell & PWA basics**: `public/` structure, `index.html`, manifest, icons, service worker precache, safe-area layout, portrait overlay, Pages deploy workflow. *Done when:* deployed to GitHub Pages, installs to the Home Screen and launches standalone offline.
2. **Capture form + storage**: mood select with colours, textareas, IndexedDB save, confirm-and-lock on save, draft autosave.
3. **Past entries**: colour-coded list, read-only detail view, hash routing, drawer menu.
4. **Settings & reminder**: reminder time and toggle, in-app reminder sheet, skip when today's entry exists, JSON export, `storage.persist()`.
5. **Polish & device testing**: dark mode, keyboard behaviour, contrast checks, real-device test on the 12 mini.

---

## 7. Dev & testing

- Serve locally with any static server from `public/` (`npx serve public`, `python3 -m http.server -d public`). To mimic the GitHub Pages sub-path, serve the parent folder and open `/public/`. This catches any paths that wrongly start with `/`.
- On the phone, test via the GitHub Pages URL, which is already HTTPS. Push to `main` and deploy early.
- Debug with Safari's Web Inspector (Mac Safari → Develop → [iPhone]) connected to the installed PWA.
- Test the reminder by setting its time a minute in the past, then backgrounding and reopening the app. Check that it comes back after tapping **Later** and reopening, and that it doesn't show after saving an entry.
- Desktop Chrome DevTools device mode (iPhone 12 mini preset, 375×812) for fast layout iteration. Always confirm on the real device.

---

## 8. Roadmap

### Push notifications (daily reminder when the app is closed)

**Goal:** the whole project runs from GitHub, with no Cloudflare Worker or other third-party backend.

#### Can the service worker do it alone? No.
A service worker only runs when the browser wakes it for an event, such as a fetch or an incoming push. It cannot set itself a timer that fires at 21:00 tomorrow. Every API that would allow on-device scheduling is unavailable on iOS:

| API | Status | Usable on iPhone? |
|---|---|---|
| Notification Triggers (`showTrigger` / `TimestampTrigger`) | Chrome experiment, abandoned | No |
| Periodic Background Sync | Chromium only, and timing is up to the browser (roughly once a day at best, not at a set time) | No |
| `setTimeout` inside the SW | iOS kills the SW within seconds of going idle | No |
| `showNotification()` from an open page | Works, but only while the app is open (which the in-app reminder already covers) | Not useful |
| **Web Push** (iOS 16.4+, Home Screen app) | Supported, but the push must be **sent from a server** (any HTTPS client holding the VAPID private key) | **Yes**, and it's the only option |

The service worker is still needed to receive and show the push. It just can't be what triggers it.

#### Viable option: GitHub Actions as the push sender
The "server" doesn't need to be always on. It only has to send one HTTPS request a day, signed with the VAPID key. A scheduled GitHub Actions workflow can do that, which keeps everything on GitHub: Pages hosts the app and Actions sends the push.

**How it works:**
1. **Keys:** generate a VAPID key pair once (`npx web-push generate-vapid-keys`). The **public** key goes in the app code, where it's safe to publish. The **private** key goes in the repo secret `VAPID_PRIVATE_KEY`.
2. **Subscribe (client):** Settings gets an **Enable notifications** button: `Notification.requestPermission()` (it must come from a tap) → `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`. Because there's no backend to POST to, the app shows the subscription JSON with a **Copy** button.
3. **Register (manual, once):** paste that JSON into the repo secret `PUSH_SUBSCRIPTION`. Single user, single device, so a manual step is acceptable.
4. **Send (workflow):** `.github/workflows/reminder.yml` runs on a `schedule` cron (plus `workflow_dispatch` for testing). A small Node script uses the `web-push` package to send `{ title, body }` to the stored subscription. If the push service returns 404 or 410, the job fails, which emails you to re-subscribe.
5. **Receive (SW):** a `push` handler calls `showNotification('rubber-duck 🦆', { body: 'How was your day? Tell the duck.' })`. A `notificationclick` handler focuses or opens `./#/today`.

**Limitations to accept:**

| Issue | Impact | Mitigation |
|---|---|---|
| **Can't skip when today is already written.** Entries only exist on the phone, so the workflow can't know. And iOS requires every push to show a visible notification (silent pushes get the subscription revoked), so the SW can't swallow it either. | You'd get the reminder even on days you've written | The SW checks IndexedDB and changes the text instead ("Already written today ✓" vs "How was your day?"). Or set the reminder time late enough that it rarely matters. |
| **Cron timing is fuzzy.** GitHub schedules are best-effort: runs are often 5–30 min late, and occasionally dropped under load. | The reminder arrives "around" 21:00, not at 21:00 | Fine for a journaling nudge. Avoid `:00` (the busiest minute). |
| **Cron is UTC only.** | Shifts by an hour at daylight-saving changes | Schedule both UTC candidates and let the script exit early unless local time in `TZ` (a repo variable) is within the window. |
| **The reminder time is set in the repo, not the app.** The app has no way to write to GitHub without storing a token on the phone, which we won't do. | Changing the time means editing a repo variable (`REMINDER_TIME`) | With a half-hourly cron, the script compares `REMINDER_TIME` with local time, so only the variable changes, never the workflow. |
| **Scheduled workflows are disabled after 60 days without repo activity** (public repos) | Reminders silently stop | GitHub emails a warning first. Any commit, or re-enabling in the Actions tab, restarts them. |
| **Action minutes** | Public repo: free. Private repo: 2,000 free minutes a month, and each run rounds up to 1 min. A half-hourly cron is about 1,440 min a month. | Use a public repo, or narrow the cron to a 2-hour evening window (about 150 min a month). |
| **The subscription can change** (iOS may rotate it, or a reinstall makes a new one) | Pushes fail until the secret is updated | Failed run → email. The app shows the current subscription and flags it if it differs from the one last copied. |

**Privacy:** unchanged. No journal content leaves the phone. The only thing stored is the push endpoint, as an encrypted secret, never committed. The workflow file itself can be public.

#### Verdict
- **Service worker alone: not viable** on iOS, or anywhere reliable. Some server has to send the push.
- **GitHub Actions cron + Web Push: viable**, and meets the "everything on GitHub" goal. It suits a single-user app if you can live with: a reminder that arrives a bit late, no skip-if-written (softened by the SW changing its text), and setting the time in the repo rather than the app.
- **A real backend** (Cloudflare Worker cron + KV, Deno Deploy) is only needed for exact timing, skip-if-written, setting the time in the app, or multiple users/devices. It's kept below as the fallback.

#### Build steps (GitHub Actions version)
1. Generate VAPID keys and add the secrets `VAPID_PRIVATE_KEY` and `PUSH_SUBSCRIPTION`, plus the variables `VAPID_PUBLIC_KEY`, `REMINDER_TIME` and `TZ`.
2. Client: an Enable notifications section in Settings (permission → subscribe → show and copy JSON). Only show it when installed to the Home Screen (`isStandalone`), since iOS only allows push there.
3. SW: `push` handler (checks IndexedDB for today, then picks the text) and `notificationclick` handler. Bump `CACHE_VERSION`.
4. `tools/send-reminder.mjs` (Node, `web-push`) and `.github/workflows/reminder.yml` (cron + `workflow_dispatch`).
5. Test: run the workflow by hand with the app closed. Then check that the timing window behaves across the DST shift.
6. The in-app reminder stays as a backup.

#### Fallback: dedicated backend
For if the limitations above become a problem:
- A Cloudflare Worker (Cron Trigger + KV) or Deno Deploy cron stores `{ subscription, notifyTime, timezone }`, sends at the right local time, and deletes subscriptions that return 404/410.
- On save, the client calls `POST /journalled`, so the server skips that day.
- The app POSTs its subscription and time directly, with no manual copying.

### Other ideas
- JSON import / restore.
- Simple stats (mood over time, streaks).
