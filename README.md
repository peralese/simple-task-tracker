# 📝 Task Tracker App (No-Code, Google Apps Script)

A personal task tracking application built with **Google Forms**, **Google Sheets**, and **Google Apps Script**.  
It allows you to submit, track, and receive reminders for tasks — all using free Google tools, optimized for both desktop and mobile use.

---

## 🚀 Features

- ✅ Add tasks via a Google Form (mobile-friendly)
- ✅ Attach notes, due dates, and reminders
- ✅ Set task status (Open, In Progress, Complete)
- ✅ Mark priority (High, Medium, Low)
- ✅ Automatically receive:
  - 📬 Daily reminders for tasks due today (resends if due date is changed)
  - 📊 Daily summary of all open tasks (skips weekends)
- ✅ Automatically generate a unique Task ID
- ✅ Track last modified date for each task
- ✅ Auto-archives completed tasks and stamps archive date
- ✅ Color-coded task urgency and priority
- ✅ Editable directly in Google Sheets (manual task creation also supported)
- ✅ Works on mobile via Google Sheets app and form link

---

## 🧾 Google Sheet Columns Used

| Column | Description |
|--------|-------------|
| `Timestamp` | Auto-generated from Google Form |
| `Task Name` | Short task title |
| `Notes` | Detailed notes about the task |
| `Due Date` | Used for reminders and urgency color-coding |
| `Status` | Open / In Progress / Complete |
| `Send Reminder?` | Checkbox from form submission |
| `Priority` | High / Medium / Low |
| `Task ID` | Auto-generated unique task identifier |
| `Last Modified` | Timestamp of last manual edit (auto-updated) |
| `Email Notified` | Timestamp when email reminder was last sent |
| `Date Archived` | (In Archive tab) Date the task was moved to archive |

---

## 📧 Reminder Behavior

- Sends reminders only for:
  - Tasks due **today**
  - With `Send Reminder?` = "Yes"
  - That have **not already received a reminder today**
- If the **due date is edited**, the `Email Notified` field is cleared so the reminder will send again
- Skips reminder emails for **weekends**

---

## 📦 Auto-Archive Behavior

- Moves rows where `Status = Complete` to a separate sheet named `Archive`
- Automatically creates `Archive` sheet if it doesn’t exist
- Adds a `Date Archived` column and timestamp per task
- Preserves full row content and column order
- Can be triggered manually or scheduled (e.g., daily)

---

## 🗂️ Priority and Due Date Color Coding

| Priority | Style |
|----------|-------|
| High     | 🔴 Red |
| Medium   | 🟠 Orange |
| Low      | 🟢 Green |

Due dates are color-coded based on urgency:
- 🔴 Overdue
- 🟡 Due Today
- 🟢 Due Tomorrow (optional rule)
- ⚫ Complete (gray)

---

## 🛠 Roadmap

- [x] Google Form for task submission
- [x] Reminder and summary email automation
- [x] Priority dropdown + color formatting
- [x] Auto-generate Task ID
- [x] Last Modified timestamp via onEdit()
- [x] Auto-archive completed tasks
- [x] Add `Date Archived` column and value
- [x] Skip daily summary emails on weekends
- [x] Reset reminders if due date changes
- [ ] Mobile UX enhancements (shortcuts, layout)
- [ ] Dashboard tab (charts, filters)
- [ ] Calendar view integration (Google Calendar or Sheets calendar layout)

---

## License 

MIT License

You are free to use, modify, and distribute this tool with attribution.

---

## Author

**Erick Perales** — IT Architect, Cloud Migration Specialist  
[https://github.com/peralese](https://github.com/peralese)
