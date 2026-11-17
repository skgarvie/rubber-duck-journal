# rubber-duck — PWA Journal Plan

A small, offline-first journaling PWA. You answer one short prompt a day: a mood, the standouts, and notes. Built with plain HTML, CSS and JavaScript (ES modules, no framework, no build step), tuned for an iPhone 12 mini in portrait. It is hosted on **GitLab Pages** to begin with.

---

## 1. Goals & constraints

| Item | Decision |
|---|---|
| Target device | iPhone 12 mini: 375×812 CSS px viewport, DPR 3, notch, home indicator |
| Orientation | Portrait only |
| Stack | Vanilla JS (ES modules), HTML, CSS. No framework, no bundler |
| Hosting | GitLab Pages (static files only, no backend) |
| Data | Stored on the device only (IndexedDB). No accounts, no server |
| Offline | Works fully offline after the first load |
| Reminders | In-app pop-up only for v1. Push notifications are on the roadmap (§8) |

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

  The form's accent colour updates live to match the selected mood.
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
- Tapping a card or a day opens a read-only detail view with the full standouts and notes. There are no edit or delete controls. The back link returns to wherever you came from (the list, or the same calendar month).
- **Sample data (dev only):**
  - Open the app with `?seed` (or `?seed=N`) to add 20 (or N) sample entries to empty past days, with a few gaps left in.
  - Open it with `?unseed` to remove them.
  - Sample entries are flagged `sample: true`, so real entries are never overwritten or removed.
  - `js/dev-seed.js` is loaded only when one of these flags is present, and is not in the offline cache.

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

## 4. GitLab Pages specifics

- GitLab Pages serves the `public/` folder, so all app files live there.
- The site is usually served from a **sub-path** (`https://<user>.gitlab.io/rubber-duck-journal/`), so:
  - Use **relative URLs everywhere** (`./css/app.css`, `./sw.js`), never ones starting with `/`.
  - Manifest: `"start_url": "./"`, `"scope": "./"`.
  - Register the service worker with `navigator.serviceWorker.register('./sw.js')`. Its scope then defaults to the sub-path.
  - Precache list in `sw.js` uses relative paths.
- HTTPS is provided by GitLab, which service workers and installation require.
- `.gitlab-ci.yml` contains a minimal `pages` job that just publishes `public/` (no build step):
  ```yaml
  pages:
    stage: deploy
    script: [ "echo deploying" ]
    artifacts:
      paths: [ public ]
    rules:
      - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
  ```
- Moving to another host later won't change the app: it's just static files with relative paths.

---

## 5. Architecture

```
rubber-duck-journal/
├── .gitlab-ci.yml
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
    │   ├── dev-seed.js         # ?seed / ?unseed sample data (dev only, not cached)
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

1. **Shell & PWA basics**: `public/` structure, `index.html`, manifest, icons, service worker precache, safe-area layout, portrait overlay, `.gitlab-ci.yml`. *Done when:* deployed to GitLab Pages, installs to the Home Screen and launches standalone offline.
2. **Capture form + storage**: mood select with colours, textareas, IndexedDB save, confirm-and-lock on save, draft autosave.
3. **Past entries**: colour-coded list, read-only detail view, hash routing, drawer menu.
4. **Settings & reminder**: reminder time and toggle, in-app reminder sheet, skip when today's entry exists, JSON export, `storage.persist()`.
5. **Polish & device testing**: dark mode, keyboard behaviour, contrast checks, real-device test on the 12 mini.

---

## 7. Dev & testing

- Serve locally with any static server from `public/` (`npx serve public`, `python3 -m http.server -d public`). To mimic the GitLab sub-path, serve the parent folder and open `/public/`. This catches any paths that wrongly start with `/`.
- On the phone, test via the GitLab Pages URL, which is already HTTPS. Push to a branch and deploy early.
- Debug with Safari's Web Inspector (Mac Safari → Develop → [iPhone]) connected to the installed PWA.
- Test the reminder by setting its time a minute in the past, then backgrounding and reopening the app. Check that it comes back after tapping **Later** and reopening, and that it doesn't show after saving an entry.
- Desktop Chrome DevTools device mode (iPhone 12 mini preset, 375×812) for fast layout iteration. Always confirm on the real device.

---

## 8. Roadmap

### Push notifications (daily reminder when the app is closed)
iOS has **no local scheduled notifications** for PWAs: no Notification Triggers API, no Periodic Background Sync. A notification at a set time therefore needs a **server that sends a Web Push message** (iOS 16.4+, Home Screen PWAs only, permission granted from a user tap). GitLab Pages is static-only, so this waits on choosing a backend host.

Outline for when hosting is decided:
- **Backend** (JS), e.g. a Cloudflare Worker with a Cron Trigger plus KV, Deno Deploy cron, or Node with `node-cron` + `web-push` on a VPS. It stores `{ subscription, notifyTime, timezone }` per device. On each tick (~5 min) it sends a VAPID-signed push to devices whose local time has just passed `notifyTime` and that haven't been sent one today. It deletes subscriptions that return 404/410.
- **Skip if already written**: on save, the client calls `POST /journalled {endpoint, date}`. The server skips that day's push for that device. This matches the in-app reminder rule.
- **Client**: an "Enable notifications" button in Settings (`Notification.requestPermission()` → `pushManager.subscribe`). It POSTs the subscription, time and timezone (`Intl.DateTimeFormat().resolvedOptions().timeZone`), re-POSTs when the time changes, and unsubscribes and DELETEs on disable.
- **Service worker**: a `push` handler calls `showNotification("rubber-duck 🦆", { body: "How was your day? Tell the duck." })`. A `notificationclick` handler focuses or opens `./#/today`.
- No journal content is sent to the server. It only knows the push address, time, timezone and whether you journalled that day.
- The in-app reminder stays as a fallback.

### Other ideas
- JSON import / restore.
- Simple stats (mood over time, streaks).
