# 📝 Task Tracker App (Google Sheets + Apps Script)

A personal task tracker built with **Google Forms**, **Google Sheets**, and **Google Apps Script**.  
Submit tasks from your phone, see them in Sheets, get email reminders, and automatically roll recurring tasks forward.

---

## What’s new (2025‑09‑29)

- **Recurring tasks are hardened**: works with checkbox values (`TRUE/FALSE`) or text (`Yes/True/Y/1/✓`).  
- **Header row auto‑detect**: the script locates the real header row (not assumed to be row 1).  
- **Flexible headers**: tolerates variants like `Send Reminder?` vs `Reminder`, `Task Name` vs `Task`.  
- **Archive + Recreate flow** refined: appends the next occurrence before deleting the completed row; archives to an **Archive** sheet with **Date Archived**.  
- **Daily trigger installer**: one function creates time‑based triggers for archive/summary/reminders (idempotent).  
- **Weekend skip**: daily summary skips Sat/Sun by default.
- **Explicit sheet targeting**: set `CONFIG.SHEET_NAME` to your data tab (e.g., `Form_Responses`). Fallback auto‑detect is included.

---

## Features

- Add tasks with: Task Name, Notes, **Due Date**, **Status** (Open/In Progress/Complete), **Priority**, **Send Reminder?**.
- **Email reminders** for tasks due **today** (stamps `Email Notified` to avoid duplicate sends).  
- **Daily summary** email of **open** tasks (skips weekends).  
- **Auto‑archive** completed tasks to `Archive` and stamp `Date Archived`.  
- **Recurring tasks**: when a completed task is marked recurring, a fresh “Open” row is created with Due Date pushed forward by `Repeat Every` days and a new Task ID.  
- **On‑edit hygiene**: `Last Modified` is updated on any edit; changing `Due Date` clears `Email Notified` so the reminder can resend on the new date.
- **Local editing via `clasp`** (optional) with `.claspignore` / `.gitignore` recipes included.

---

## Sheet structure (columns)

The code is flexible, but expect a table with headers similar to the following (names may vary slightly):

| Column            | Notes                                                                 |
|-------------------|-----------------------------------------------------------------------|
| `Timestamp`       | From the Form                                                         |
| `Task Name`       | Short title (`Task` also accepted)                                    |
| `Notes`           | Optional details                                                      |
| `Due Date`        | A real date value (not text)                                          |
| `Status`          | `Open`, `In Progress`, or `Complete`                                  |
| `Send Reminder?`  | Checkbox/text; “Yes” values trigger reminders                         |
| `Priority`        | `High` / `Medium` / `Low`                                             |
| `Recurring?`      | **Checkbox** `TRUE/FALSE` or text “Yes/True/Y/1/✓”                    |
| `Repeat Every`    | **Number of days** (e.g., 7)                                          |
| `Task ID`         | Auto‑generated if blank                                               |
| `Email Notified`  | Timestamp set when reminder email is sent                             |
| `Last Modified`   | Auto‑stamped on edits                                                 |

> The `Archive` sheet is auto‑created and gets a `Date Archived` column added automatically.

---

## Configuration

Open `Code.js` and set:

```js
const CONFIG = {
  SHEET_NAME: "Form_Responses",      // <-- your data tab
  ARCHIVE_SHEET_NAME: "Archive",
  RECIPIENT_EMAIL: "you@example.com"
};
```

- If `SHEET_NAME` isn’t found, the script tries to **auto‑detect** the data sheet by scanning for common headers.  
- Time zone is taken from the spreadsheet (File → Settings).

---

## Install the daily triggers (Option A)

Run this **once** from the Apps Script editor:

1. Open **`trigger.gs`**.
2. Run **`ensureDailyTriggers`** and approve scopes.
3. Verify under **Triggers (⏰ icon)** you now have three time‑driven entries:
   - `archiveCompletedTasks` (daily)
   - `sendTaskSummary` (daily; **weekend skip** inside the function)
   - `sendTaskReminders` (daily)

Helpful utilities (optional):
- `listTriggers()` → prints triggers to Logs
- `clearTimeBasedTriggers()` → removes time‑based triggers so you can reinstall

---

## How recurrence works

When `archiveCompletedTasks` runs (by trigger or manual test):

1. Rows with `Status = Complete` are copied to **Archive** and stamped with **Date Archived**.
2. If the row is **recurring** and valid:
   - `Recurring?` is truthy (checkbox `TRUE` or a “yes‑ish” value);
   - `Repeat Every` is a finite **number > 0** (days);
   - `Due Date` is a valid **Date**;
   then the script **appends a new row** with:
   - `Status = Open`
   - `Due Date = old Due Date + Repeat Every`
   - new `Task ID`
   - `Email Notified` cleared, `Last Modified` updated
3. The original completed row is deleted from the main sheet (it remains in `Archive`).

**Why a task may _not_ be recreated**:
- `Recurring?` is unchecked/empty or evaluates to false.  
- `Repeat Every` is text or non‑numeric (e.g., “N/A”).  
- `Due Date` cell contains text instead of a Date value.  
- The column headers weren’t detected (uncommon) — see Troubleshooting.

---

## Manual smoke tests

You can test without waiting for the morning trigger:

1. Create a test row with:
   - `Status = Complete`
   - `Recurring? = TRUE` (checkbox) or `Yes`
   - `Repeat Every = 7`
   - `Due Date =` today (or any valid date)
2. In Apps Script, **Run → `archiveCompletedTasks`**.
3. Expected results:
   - The row is moved to **Archive** and stamped with **Date Archived**.
   - A **new “Open” row** appears in the main sheet with Due Date = previous + 7 days.

To test reminders:
- Create a row with `Status = Open`, `Due Date = today`, `Send Reminder? = Yes`, `Email Notified` blank.
- Run **`sendTaskReminders`**. You should get an email and the row will be stamped in `Email Notified`.

To test daily summary (skips weekends by default):
- Run **`sendTaskSummary`** on a weekday. It will email a table of open tasks.

---

## Troubleshooting

- **“Row N: COMPLETE. recurring=false …” in Logs**  
  The `Recurring?` cell evaluated to false. For checkboxes it must be **checked** (TRUE). For text, accepted values include “Yes/True/Y/1/✓”.

- **“Repeat Every invalid/zero”**  
  Make sure the cell is a **number** (e.g., `7`) — not `N/A` or text.

- **“Due Date missing/invalid”**  
  Re‑enter the Due Date as a date (left‑aligned text is a red flag).

- **“Missing ‘Status’ column; aborting.”**  
  The script couldn’t find headers near the top. We now **auto‑detect** the header row by scanning the first 10 rows.  
  If your header is deeper, open `Code.js` and increase the scan window in `_locateHeaderRow` (e.g., to 25).

- **No emails**  
  Confirm `RECIPIENT_EMAIL` and check **Apps Script → Executions** for errors. Summary intentionally skips weekends.

- **Wrong sheet**  
  Ensure `CONFIG.SHEET_NAME` matches your tab (e.g., `Form_Responses`). You can also rely on the auto‑detect fallback.

---

## Local development (optional) with `clasp`

```bash
npm i -g @google/clasp
clasp login
clasp clone <SCRIPT_ID>
# edit locally, then
clasp push
```

**.claspignore** (push only `appsscript.json` and `src/**`):
```
**/*
!appsscript.json
!src/**

node_modules/**
.git/**
.vscode/**
.env
**/*.map
```

**.gitignore**:
```
node_modules/
.env
.vscode/
.idea/
dist/
build/
.DS_Store
Thumbs.db

.clasp.json
.claspignore
appsscript.json.backup
```

---

## Roadmap

- [x] Email reminders + daily summary (skip weekends)
- [x] Auto‑archive and recurring task recreation
- [x] Trigger installer & helpers
- [x] Flexible headers + checkbox‑friendly recurrence
- [x] Header row auto‑detection
- [ ] Dashboard tab (filters & charts)
- [ ] Calendar‑style view
- [ ] Mobile quick actions / shortcuts

---

## License

MIT

---

## Author

**Erick Perales** — IT Architect, Cloud Migration Specialist  
<https://github.com/peralese>