# rubber-duck 🦆

A tiny daily journal that runs as a Progressive Web App (PWA). Once a day you tell the duck how it went: pick a mood, note the standouts, and add anything else.

- Built for the **iPhone 12 mini**, portrait only (works on any modern phone).
- Plain **HTML, CSS and JavaScript** (ES modules). No framework, no dependencies, no build step.
- **Offline-first.** Entries are stored only on your phone (IndexedDB). Nothing is sent anywhere.
- Hosted as static files on **GitHub Pages**.

## Features

- **Today**: a mood dropdown (Terrible → Bad → Okay → Good → Fantastic), plus Notes and Standouts fields. The form's colour follows the selected mood, and unsaved text is kept as a draft.
- **One entry per day, locked once saved.** You confirm before saving. Once an entry exists for a date, it can't be overwritten.
- **Past entries**, read-only, with two views:
  - **Calendar** (the default): a month grid on a slate-navy card (`#3a4a6a`), where each day with an entry is filled with its mood colour. Swipe or use ‹ › to change month.
  - **List**: newest first, each card coloured by mood from black through blue to green.

  Tap a card or a day to see the full entry. Empty fields are left out of cards and entries.
- **In-app reminder**: after your chosen time (default 21:00), opening the app shows a "How was your day?" prompt if you haven't written today. **Later** dismisses it until the next time you open the app. It never appears once today's entry is saved.
- **Mood-coloured header**: on Today, the top bar takes on the colour of the mood you pick (or the mood you saved).
- **Settings**: turn the reminder on or off and set its time, export all entries as JSON, and check whether storage is protected.
- **Testing tools** (Settings → Testing): add 60 sample entries, or clear all data.

| Mood | Colour |
|---|---|
| Terrible | `#0b0b0f` |
| Bad | `#1e2a6b` |
| Okay | `#2563eb` |
| Good | `#0d7f74` |
| Fantastic | `#15803d` |

## Project structure

```
.
├── .github/workflows/
│   └── pages.yml           # GitHub Pages deploy (publishes public/)
├── PLAN.md                 # design plan and roadmap
├── tools/
│   └── make-icons.py       # regenerates the PNG icons (stdlib only)
└── public/                 # everything that gets deployed
    ├── index.html          # app shell, dialogs, drawer
    ├── manifest.webmanifest
    ├── sw.js               # service worker (offline cache)
    ├── css/app.css
    ├── icons/
    └── js/
        ├── app.js          # boot, routing, drawer, reminder checks
        ├── router.js       # hash router (#/today, #/entries, …)
        ├── db.js           # IndexedDB wrapper
        ├── moods.js        # mood scale and colours
        ├── settings.js     # localStorage settings and draft
        ├── reminder.js     # in-app reminder logic and UI
        ├── dates.js        # local-date helpers
        ├── ui.js           # escaping, confirm dialog, toast
        ├── components.js   # shared entry card, detail HTML, List/Calendar tabs
        ├── dev-seed.js     # ?seed / ?unseed sample data (dev only)
        └── views/          # today, entries, calendar, entry-detail, settings
```

## Setup

### Prerequisites

- **git**
- Any static file server. Both of these work:
  - Python 3 (`python3 -m http.server`), or
  - Node.js (`npx serve`)
- Safari on an iPhone for real-device testing. A Mac with Safari is useful for remote debugging.

Nothing needs installing: there is no `npm install` and no build.

### 1. Get the code

```sh
git clone https://github.com/<username>/rubber-duck-journal.git
cd rubber-duck-journal
```

### 2. Run locally

Serve the **project root** and open the app under `/public/`. This mimics the GitHub Pages sub-path (`/rubber-duck-journal/`), so any URL that wrongly starts with `/` breaks locally first:

```sh
python3 -m http.server 8000
# open http://localhost:8000/public/
```

Or serve `public/` directly:

```sh
npx serve public
```

Service workers are allowed on `localhost` without HTTPS. For a phone-sized view in desktop Chrome, open DevTools → device toolbar → **iPhone 12 mini** (375×812).

> **Tip:** the service worker caches aggressively. While developing, tick **DevTools → Application → Service workers → Update on reload**, or use **Disable cache** in the Network tab, so you always see your latest changes.

### Sample data

The quickest way is **Settings → Testing**:

- **Add 60 sample entries** fills empty past days. It never replaces a day you've written.
- **Clear all data** deletes **every** entry, real ones included, and resets all settings. It asks for confirmation first.

You can also use URL flags:

To try out the list and calendar without writing entries by hand, add a flag to the URL:

| URL | Effect |
|---|---|
| `http://localhost:8000/public/?seed` | Adds 20 sample entries to empty past days, with a few gaps left in |
| `http://localhost:8000/public/?seed=60` | Adds 60 sample entries |
| `http://localhost:8000/public/?unseed` | Removes all sample entries |

- Sample entries are flagged `sample: true`. Seeding never touches today or any day that already has an entry, and `?unseed` removes only sample entries, so your real entries are safe.
- The flag is removed from the address bar afterwards, so reloading doesn't seed again.
- This works on the deployed site too (e.g. `https://<username>.github.io/rubber-duck-journal/?seed`).

### 3. Deploy to GitHub Pages

The workflow in [`.github/workflows/pages.yml`](.github/workflows/pages.yml) publishes the `public/` folder as the site root. It runs on every push to `main` and can also be run by hand from the **Actions** tab.

One-time setup:

1. In the GitHub repo, go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**. (Not "Deploy from a branch": that can only publish the repo root or `/docs`, which would put the app at `…/public/`.)
3. Push to `main`, or run the workflow from the **Actions** tab.
4. When the **Deploy to GitHub Pages** run finishes, the site is live at `https://<username>.github.io/rubber-duck-journal/`. The URL is also shown on the run and under **Settings → Pages**.

The app uses only relative URLs, so it also works on a custom domain at the root.

> GitHub Pages sites are publicly reachable, even when the repo is private, unless you're on GitHub Enterprise Cloud with private Pages. That's fine here: the site is only the app code, and entries never leave your phone.

### 4. Install on the iPhone

1. Open the Pages URL in **Safari**.
2. Tap **Share** → **Add to Home Screen** → **Add**.
3. Launch **rubber-duck** from the Home Screen.

Installing matters. The app then runs full-screen and works offline, and Safari won't clear its storage. Settings → Storage shows whether your entries are protected.

## Releasing updates

The service worker serves files cache-first, so installed apps won't pick up changes until the cache version changes. For every release:

1. Bump `CACHE_VERSION` in [`public/sw.js`](public/sw.js) (e.g. `'v1'` → `'v2'`).
2. If you added files, add them to the `ASSETS` list in the same file.
3. Commit and push. The next time the app is opened, it downloads the new version and shows **"A new version is ready. Reload"**.

## Testing on a device

- Debug the installed app from a Mac: on the iPhone, turn on **Settings → Safari → Advanced → Web Inspector**. Connect the phone, then in Mac Safari go to **Develop → [your iPhone] → rubber-duck**.
- To test the reminder, set the reminder time a minute in the past, then background and reopen the app:
  - the prompt should appear,
  - after **Later** and reopening, it should appear again,
  - after saving today's entry, it shouldn't appear.
- To test offline, turn on Airplane Mode and relaunch from the Home Screen.

## Your data

- Entries live in IndexedDB on the device (database `rubber-duck`, store `entries`, keyed by local date `YYYY-MM-DD`). Settings and the unsaved draft live in `localStorage`.
- **There is no sync or cloud backup.** Use **Settings → Export** regularly, and be careful with **Settings → Testing → Clear all data**, which can't be undone. On iOS this opens the share sheet, where you can choose **Save to Files**.
- Deleting the Home Screen app deletes its data.

Export format:

```json
{
  "app": "rubber-duck",
  "format": 1,
  "exportedAt": "2026-11-17T10:00:00.000Z",
  "entries": [
    { "date": "2026-11-17", "mood": 4, "standouts": "…", "notes": "…", "createdAt": 1763370000000 }
  ]
}
```

## Icons

The PNG icons in `public/icons/` are generated from simple shapes that match `icon.svg`. To regenerate them after changing colours or shapes in the script:

```sh
python3 tools/make-icons.py
```

## Roadmap

See [PLAN.md §8](PLAN.md#8-roadmap). The main item is **push notifications**, so the daily reminder arrives even when the app is closed. iOS can't schedule notifications on the device, so this needs a small backend to send Web Push messages, and it's waiting on a hosting decision. Other ideas: JSON import and mood stats.
