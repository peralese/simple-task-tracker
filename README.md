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

## Deploy To Railway

This project includes:

- [Dockerfile](./Dockerfile) for a single deployable container
- [render.yaml](./render.yaml) for a one-click Render-style deployment config

Railway steps:

1. Push the repo to GitHub.
2. Create a new Railway project from the repo.
3. Point Railway at the `task-app` directory or use [Dockerfile](./Dockerfile).
4. Add the env vars from [.env.example](./.env.example).
5. Set `VITE_VAPID_PUBLIC_KEY` to the same value as `VAPID_PUBLIC_KEY` for the frontend build.
6. Deploy and verify `/health`.
