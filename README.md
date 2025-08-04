# 📝 Task Tracker App (No-Code, Google Apps Script)

A no-code personal task tracking application built with **Google Forms**, **Google Sheets**, and **Google Apps Script**.  
It allows you to submit, track, and receive reminders for tasks — all using free Google tools, optimized for both desktop and mobile use.

---

## 🚀 Features

- ✅ Add tasks via a Google Form (mobile-friendly)
- ✅ Attach notes, due dates, and reminders
- ✅ Set task status (Open, In Progress, Done)
- ✅ Mark priority (High, Medium, Low)
- ✅ Automatically receive:
  - 📬 Daily reminders for tasks due today
  - 📊 Daily summary of all open tasks
- ✅ Auto-archives completed tasks
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
| `Status` | Open / In Progress / Done |
| `Priority` | High / Medium / Low |
| `Send Reminder?` | Checkbox from form submission |
| `Reminder Sent?` | Auto-updated after reminder is emailed |
| `Last Notified` | Timestamp of last email |
| `Date Archived` | (In Archive tab) Date the task was moved to archive |

---

## 📧 Reminder Behavior

- Only sends reminders for:
  - Tasks due **today**
  - With `Send Reminder?` = "Yes"
  - That have **not already been notified**
- Updates `Reminder Sent?` and `Last Notified` upon success

---

## 📦 Auto-Archive Behavior

- Moves rows where `Status = Done` to a separate sheet named `Archive`
- Creates `Archive` sheet automatically if it doesn’t exist
- Preserves headers and full row content
- Can be triggered manually or scheduled (e.g., daily)

---

## 🗂️ Priority Color Coding

| Priority | Style |
|----------|-------|
| High     | 🔴 Red |
| Medium   | 🟠 Orange |
| Low      | 🟢 Green |

Due dates are also color-coded:
- 🔴 Overdue
- 🟡 Due Today
- 🟢 Upcoming (within 7 days)
- ⚫ Done (gray)

---

## 🛠 Roadmap

- [x] Core task form and tracker sheet
- [x] Reminder and summary email automation
- [x] Priority support + visual formatting
- [x] Auto-archive “Done” tasks
- [ ] Add `Date Archived` stamp to archive rows
- [ ] Mobile UX improvements (shortcuts, layout)
- [ ] Dashboard tab (task counts, status pie charts)
- [ ] Calendar view integration

---

## License 

MIT License

You are free to use, modify, and distribute this tool with attribution.

---

## Author

**Erick Perales** — IT Architect, Cloud Migration Specialist  
[https://github.com/peralese](https://github.com/peralese)

