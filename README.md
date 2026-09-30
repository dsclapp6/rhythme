# Weekly Planner

A React planner with weekly and monthly calendars, multiple schedule overlays,
regular tasks, recurring tasks, goals, reminders, and configurable sections.
The existing periwinkle layout and interaction flow are preserved.

## Development

Use Node.js 20.19+ or 22.12+ (Node 22 is used in CI).

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. `npm run build` generates `dist/`;
`npm run preview` serves that production build locally.

```sh
npm run check          # lint, regression tests, production build, credential scan
npm audit             # check dependency advisories
npm run test:watch
```

## Data and backups

Planner data stays in this browser's localStorage under the existing `planner*`
keys. Updates are written before the UI confirms success, and refresh across
browser tabs. Rapid task/schedule updates use the latest saved collection.

Moving, creating, or resizing an event cannot overwrite another event in the
same schedule. Separate schedules can still overlap. Moves preserve duration
and metadata; drops outside the grid, invalid resizes, and events that do not
fit leave the existing events in place. Escape cancels a drag.

Weekly dates remain consecutive across month/year boundaries. Month navigation
clamps to the last day of the target month. Recurring completion resets at the
start of its day, Sunday-based week, month, or year; the task itself remains.
Legacy boolean recurring checks migrate to the current period on first load.

If storage is full, unavailable, or malformed, the app reports the problem.
Failed writes retain saved data and entered text. Unreadable stored sections
are preserved and blocked from being overwritten with empty defaults.
The **Export backup** action in the warning includes both parsed data and
original `rawStorage` strings, including malformed sections for recovery.
Do not clear browser site data to troubleshoot without first making a backup.

`StorageUtils` exports `exportAppData`, `downloadAppData`, and `importAppData`.
Imports validate all recognized sections before writing and attempt rollback
if any write fails. Backups contain your private planner content; store them
accordingly. There is no cloud synchronization or backend in this app.

## Keys and deployment

The unused Firebase client configuration with its embedded API key was removed.
The planner does not need a Firebase SDK or any runtime API key. Firebase Hosting
deployments authenticate using GitHub Actions secrets, never browser code.
Keep private credentials on a backend or in CI secrets. Vite-prefixed environment
variables are bundled into browser code and must never contain private secrets.

Environment files, private-key files, service-account files, dependencies, and
build output are ignored. Production source maps are disabled. The credential
scan checks source files, workflows, public assets, and built output for common
credential patterns and production source maps; it is not a universal detector.
Removing a published key does not revoke it or erase earlier Git commits. Review
and restrict/rotate the previously published Firebase key in Google Cloud.

The Firebase Hosting workflows install dependencies, run checks and a dependency
audit, then deploy `dist/`. The existing hosting project ID is retained. Configure
`FIREBASE_SERVICE_ACCOUNT_RHYTHME_1A438` in this repository's Actions secrets if
you use those workflows. Hosting adds CSP, MIME, referrer, and framing headers.
