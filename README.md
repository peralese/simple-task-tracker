# Task App

A single-user personal task manager built with an Express + SQLite backend and a React + Vite PWA frontend.

## Setup

1. Copy [.env.example](./.env.example) to `.env`.
2. Install dependencies:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

3. Generate VAPID keys:

```bash
npm run generate:vapid
```

4. Add the generated `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` values to `.env`.
5. Generate a SHA-256 passphrase hash for `PASSPHRASE_HASH`:

```bash
node -e "const crypto=require('crypto'); console.log(crypto.createHash('sha256').update('your-passphrase').digest('hex'))"
```

6. Set the rest of the environment variables in `.env`.
7. Start the app:

```bash
npm run dev
```

The backend runs on `http://localhost:3001` and the frontend runs on `http://localhost:5173`.

The app reads environment variables from the single root `.env` file. You do not need separate `backend/.env` or `frontend/.env` files.

## Environment Variables

- `PORT`: Express port.
- `JWT_SECRET`: Secret used to sign auth JWTs.
- `VAPID_PUBLIC_KEY`: Public key used for browser push subscriptions.
- `VAPID_PRIVATE_KEY`: Private key used to send web-push notifications.
- `TZ`: Scheduler timezone, for example `America/Chicago`.
- `PASSPHRASE_HASH`: SHA-256 hash of the login passphrase.
- `VITE_VAPID_PUBLIC_KEY`: same value as `VAPID_PUBLIC_KEY`
- `VITE_API_BASE_URL`: usually `http://localhost:3001`
- `DATA_DIR`: directory where `task-app.db` is stored. Leave unset to default to `./data`.

## Import Tasks From Google Sheets CSV

1. Open your Google Sheet.
2. Export it:
   File -> Download -> Comma-separated values (.csv)
3. Make sure the CSV includes:
   `Task ID`, `Title`, `Due Date`, `Priority`, `Status`, `Category`
4. Run the import:

```bash
node scripts/import-from-csv.js /path/to/export.csv
```

This imports rows into `backend/data/task-app.db`.

## Roadmap

### Completed
- Full-stack rebuild from Google Apps Script / Google Sheets to a
  React + Vite PWA with Node/Express backend and SQLite
- Task CRUD with priority levels (high / medium / low) and categories
- Task grouping: Overdue / Due Today / Upcoming / On Hold
- On Hold status — blocks notifications without archiving the task
- Recurring tasks — next occurrence auto-created on completion
- Archive — completed and cancelled tasks moved to a separate table
- Archive view in the UI with status filtering
- Web Push notifications via VAPID
- Pause notifications until a date (Settings page)
- JWT passphrase login
- CSV import from Google Sheets export
- Docker container with multi-stage build
- Self-hosted on Mac mini via Node + launchd

### Second wave
- Full-text search and combined priority + category filtering
- Smarter postpone flow — quick-pick (Tomorrow / This Weekend /
  Next Week / Custom date) instead of fixed offset
- Expandable task notes — tap card to reveal description field

### Later / nice to have
- Dashboard summary view — open/overdue/on-hold counts and
  14-day completion sparkline from archive table
- SMS fallback notifications via Twilio if push subscription lapses
