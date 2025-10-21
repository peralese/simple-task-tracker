/** ============================================================================
 * Task Tracker – Core logic (auto-detect header row + checkbox-friendly logic)
 * With extra diagnostics + tolerant "Recurring?" header handling
 * ========================================================================== */

const CONFIG = {
  SHEET_NAME: "Form_Responses",          // your tab; we also fall back to auto-detect
  ARCHIVE_SHEET_NAME: "Archive",
  RECIPIENT_EMAIL: "erickles@us.ibm.com", // change if needed
};

/** ---------- Helpers ---------- **/

function _normHeader(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[\s\-\_\/\\\?\.\:\;\,\(\)\[\]\{\}]+/g, " ")
    .trim()
    .replace(/\s+/g, "");
}
function _findColIdx(headers, candidates) {
  const map = {};
  headers.forEach((h, i) => (map[_normHeader(h)] = i));
  for (const c of candidates) {
    const k = _normHeader(c);
    if (k in map) return map[k];
  }
  return -1;
}
/** Loose finder to tolerate misspellings / trailing spaces (e.g., "Recureing? ") */
function _findColIdxLoose(headers, stem) {
  const nh = headers.map(_normHeader);
  const s = _normHeader(stem);
  for (let i = 0; i < nh.length; i++) {
    if (nh[i].startsWith(s) || nh[i].includes(s)) return i;
  }
  return -1;
}
function _isYes(val) {
  if (val === true) return true; // checkbox TRUE
  const s = String(val || "").trim().toLowerCase();
  return ["yes", "y", "true", "1", "x", "✓", "checked"].includes(s);
}
function _toNumberOrZero(val) {
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  const n = parseFloat(String(val || "").trim());
  return Number.isFinite(n) ? n : 0;
}
function _toDateOrNull(val) {
  if (val instanceof Date) return new Date(val);
  if (!val) return null;
  const d = new Date(val);
  return Number.isFinite(d.getTime()) ? d : null;
}

function getDataSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (sh) return sh;

  // Fallback: pick the first sheet that looks like the task table
  for (const s of ss.getSheets()) {
    const lastCol = s.getLastColumn();
    if (lastCol < 2) continue;
    const headers = s.getRange(1, 1, 1, lastCol).getValues()[0];
    const statusIdx = _findColIdx(headers, ["Status"]);
    const dueIdx = _findColIdx(headers, ["Due Date", "Due"]);
    if (statusIdx !== -1 && dueIdx !== -1) return s;
  }
  throw new Error('Could not find data sheet. Set CONFIG.SHEET_NAME to your tab (e.g., "Form_Responses").');
}

/** Find the row that actually contains headers (search first 10 rows). */
function _locateHeaderRow(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  const scanRows = Math.min(10, lastRow || 0);

  for (let r = 1; r <= scanRows; r++) {
    const headers = sheet.getRange(r, 1, 1, lastCol).getValues()[0];
    const hasStatus = _findColIdx(headers, ["Status"]) !== -1;
    const hasDue = _findColIdx(headers, ["Due Date", "Due"]) !== -1;
    const hasTask = _findColIdx(headers, ["Task", "Task Name"]) !== -1;
    if (hasStatus && (hasDue || hasTask)) return { headerRow: r, headers, lastCol };
  }
  throw new Error('Could not find a header row with a "Status" column in the first 10 rows.');
}

/** Build a column resolver tied to the detected header row. */
function _getTableContext(sheet) {
  const { headerRow, headers, lastCol } = _locateHeaderRow(sheet);
  const col = function () {
    return _findColIdx(headers, Array.from(arguments));
  };
  return { headerRow, headers, lastCol, col };
}

/** ---------- Emails ---------- **/

function sendTaskReminders() {
  const sheet = getDataSheet();
  const { headerRow, col } = _getTableContext(sheet);

  const dataStart = headerRow + 1;
  const lastRow = sheet.getLastRow();
  if (lastRow < dataStart) return;

  const range = sheet.getRange(dataStart, 1, lastRow - headerRow, sheet.getLastColumn());
  const data = range.getValues();

  const taskNameIdx = col("Task", "Task Name");
  const notesIdx = col("Notes", "Note");
  const dueDateIdx = col("Due Date", "Due");
  const statusIdx = col("Status");
  const priorityIdx = col("Priority");
  const priorityIdx = col("Priority");
  const remindIdx = col("Send Reminder?", "Reminder", "Remind");
  const emailNotifiedIdx = col("Email Notified", "Notified");

  const today = new Date();
  const tasksDueToday = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    if (!_isYes(row[remindIdx])) continue;
    if (emailNotifiedIdx !== -1 && row[emailNotifiedIdx]) continue;
    const statusLower = String(row[statusIdx] || "").trim().toLowerCase();
    if (["complete", "cancelled", "canceled", "postponed"].includes(statusLower)) continue;

    const d = _toDateOrNull(row[dueDateIdx]);
    if (!d) continue;

    const isToday =
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();

    if (isToday) {
      tasksDueToday.push({
        sheetRow: dataStart + i,
        taskName: taskNameIdx !== -1 ? row[taskNameIdx] : "",
        notes: notesIdx !== -1 ? row[notesIdx] : "",
      });
    }
  }

  if (tasksDueToday.length === 0) return;

  let body = `<h3>📋 Task Reminders Due Today</h3><ul>`;
  tasksDueToday.forEach((t) => {
    body += `<li><strong>${t.taskName || "(untitled)"}</strong>${t.notes ? ` – ${t.notes}` : ""}</li>`;
  });
  body += `</ul>`;

  GmailApp.sendEmail(CONFIG.RECIPIENT_EMAIL, "🕒 Task Reminder – Tasks Due Today", "", {
    htmlBody: body,
  });

  if (emailNotifiedIdx !== -1) {
    tasksDueToday.forEach((t) => sheet.getRange(t.sheetRow, emailNotifiedIdx + 1).setValue(new Date()));
  }
}

function sendTaskSummary() {
  const sheet = getDataSheet();
  const { headerRow, col } = _getTableContext(sheet);

  // Weekend skip
  const day = new Date().getDay(); // 0=Sun,6=Sat
  if (day === 0 || day === 6) return;

  const dataStart = headerRow + 1;
  const lastRow = sheet.getLastRow();
  if (lastRow < dataStart) return;

  const range = sheet.getRange(dataStart, 1, lastRow - headerRow, sheet.getLastColumn());
  const data = range.getValues();

  const taskNameIdx = col("Task", "Task Name");
  const notesIdx = col("Notes", "Note");
  const dueDateIdx = col("Due Date", "Due");
  const statusIdx = col("Status");

  const tz = Session.getScriptTimeZone();
  const openTasks = [];

  for (const row of data) {
    const status = String(row[statusIdx] || "");
    const statusLower = status.trim().toLowerCase();
    if (status && !["complete", "cancelled", "canceled", "postponed"].includes(statusLower)) {
      const d = _toDateOrNull(row[dueDateIdx]);
      const dueStr = d ? Utilities.formatDate(d, tz, "yyyy-MM-dd") : String(row[dueDateIdx] || "");
      openTasks.push({
        taskName: taskNameIdx !== -1 ? row[taskNameIdx] : "",
        notes: notesIdx !== -1 ? row[notesIdx] : "",
        dueStr,
        dueDateMs: d ? d.getTime() : Number.POSITIVE_INFINITY,
        priority: priorityIdx !== -1 ? String(row[priorityIdx] || "").trim() : "",
        status,
      });
    }
  }
  if (openTasks.length === 0) return;

  const prRank = (p) => {
    const s = String(p || "").toLowerCase();
    if (s === "high") return 0;
    if (s === "medium") return 1;
    if (s === "low") return 2;
    return 3;
  };
  openTasks.sort((a, b) => {
    const byP = prRank(a.priority) - prRank(b.priority);
    if (byP !== 0) return byP;
    return a.dueDateMs - b.dueDateMs;
  });

  let body =
    `<h3>🗂️ Daily Task Summary – Open Tasks</h3>` +
    `<table border="1" cellpadding="4" cellspacing="0"><tr><th>Priority</th><th>Task</th><th>Notes</th><th>Due Date</th><th>Status</th></tr>`;
  openTasks.forEach((t) => {
    body += `<tr><td>${t.priority || ""}</td><td>${t.taskName || ""}</td><td>${t.notes || ""}</td><td>${t.dueStr}</td><td>${t.status}</td></tr>`;
  });
  body += `</table>`;

  GmailApp.sendEmail(CONFIG.RECIPIENT_EMAIL, "🗓️ Daily Task Summary", "", { htmlBody: body });
}

/** ---------- Archive + Recurrence ---------- **/
function archiveCompletedTasks() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const main = getDataSheet();
  const { headerRow, headers, col } = _getTableContext(main);

  // Ensure Archive sheet + headers
  const archive =
    ss.getSheetByName(CONFIG.ARCHIVE_SHEET_NAME) ||
    ss.insertSheet(CONFIG.ARCHIVE_SHEET_NAME);
  const DATE_ARCHIVED = "Date Archived";
  let archHeaders = archive.getLastColumn()
    ? archive.getRange(1, 1, 1, archive.getLastColumn()).getValues()[0]
    : [];
  if (archHeaders.length === 0) {
    archHeaders = headers.slice();
    archHeaders.push(DATE_ARCHIVED);
    archive.appendRow(archHeaders);
  } else if (!archHeaders.includes(DATE_ARCHIVED)) {
    archive.getRange(1, archHeaders.length + 1).setValue(DATE_ARCHIVED);
    archHeaders = archive.getRange(1, 1, 1, archive.getLastColumn()).getValues()[0];
  }
  const dateArchivedIdx = archHeaders.indexOf(DATE_ARCHIVED);

  // Column indexes from headers (flexible)
  const statusIdx        = col("Status");
  const dueDateIdx       = col("Due Date", "Due");

  // Try to find "Recurring?" robustly (tolerate misspell like "Recureing? " + spaces)
  let recurringIdx       = col("Recurring?", "Recurring");
  if (recurringIdx === -1) {
    recurringIdx = _findColIdxLoose(headers, "recur"); // accept any header containing "recur"
  }

  const repeatEveryIdx   = col("Repeat Every", "Repeat (days)", "Repeat Days", "Frequency (days)");
  const taskIdIdx        = col("Task ID", "TaskID");
  const lastModifiedIdx  = col("Last Modified", "Updated", "Modified");
  const emailNotifiedIdx = col("Email Notified", "Notified");

  // Diagnostics (log AFTER indexes exist)
  Logger.log("Detected headers: " + JSON.stringify(headers));
  Logger.log("Recurring? column index: " + recurringIdx);

  if (statusIdx === -1) {
    Logger.log('Missing "Status" column; aborting.');
    return;
  }

  const dataStart = headerRow + 1;
  const lastRow = main.getLastRow();
  if (lastRow < dataStart) return;

  const values = main.getRange(dataStart, 1, lastRow - headerRow, main.getLastColumn()).getValues();
  const rowsToDelete = [];

  // Process bottom-up to avoid index shifts
  for (let i = values.length - 1; i >= 0; i--) {
    const row = values[i];
    const sheetRow = dataStart + i;

    const statusLower = String(row[statusIdx] || "").trim().toLowerCase();
    const shouldArchive = ["complete", "cancelled", "canceled", "postponed"].includes(statusLower);
    if (!shouldArchive) continue;

    // Archive copy with Date Archived
    const archiveCopy = row.slice();
    while (archiveCopy.length <= dateArchivedIdx) archiveCopy.push("");
    archiveCopy[dateArchivedIdx] = new Date();
    archive.appendRow(archiveCopy);

    // Recurrence (with raw value log when we have a column)
    if (recurringIdx !== -1) {
      Logger.log(`Row ${sheetRow}: recurring cell raw value = ${row[recurringIdx]}`);
    }
    const isRecurring = recurringIdx !== -1 && _isYes(row[recurringIdx]);
    const repeatDays  = repeatEveryIdx !== -1 ? _toNumberOrZero(row[repeatEveryIdx]) : 0;
    const dueDate     = dueDateIdx !== -1 ? _toDateOrNull(row[dueDateIdx]) : null;

    Logger.log(`Row ${sheetRow}: status=${statusLower}. recurring=${isRecurring} repeatDays=${repeatDays} dueDate=${dueDate}`);

    if (statusLower === "complete" && isRecurring && repeatDays > 0 && dueDate) {
      const newRow = row.slice();

      newRow[statusIdx] = "Open";
      const nextDue = new Date(dueDate); nextDue.setDate(nextDue.getDate() + repeatDays);
      if (dueDateIdx !== -1) newRow[dueDateIdx] = nextDue;

      if (taskIdIdx !== -1) newRow[taskIdIdx] = Utilities.getUuid();
      if (emailNotifiedIdx !== -1) newRow[emailNotifiedIdx] = "";
      if (lastModifiedIdx !== -1) newRow[lastModifiedIdx] = new Date();

      main.appendRow(newRow);
      Logger.log(`Row ${sheetRow}: Recurring task re-created for ${nextDue.toDateString()}.`);
    } else {
      if (statusLower !== "complete") Logger.log(`Row ${sheetRow}: Non-complete status archived (no recurrence).`);
      else if (!isRecurring) Logger.log(`Row ${sheetRow}: Not recurring; archived only.`);
      else if (!(repeatDays > 0)) Logger.log(`Row ${sheetRow}: Repeat Every invalid/zero; skipped re-create.`);
      else if (!dueDate) Logger.log(`Row ${sheetRow}: Due Date missing/invalid; skipped re-create.`);
    }

    rowsToDelete.push(sheetRow);
  }

  // Delete originals, bottom-first
  rowsToDelete.sort((a, b) => b - a).forEach((r) => main.deleteRow(r));

  Logger.log(`Archived ${rowsToDelete.length} completed row(s).`);
}

/** ---------- Form + Edit hooks ---------- **/

function onFormSubmit(e) {
  generateMissingTaskIDs();
  reapplyFormattingWithRefresh();
}

function reapplyFormattingWithRefresh() {
  const sheet = getDataSheet();
  const { headerRow } = _getTableContext(sheet);

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= headerRow) return;

  const data = sheet.getRange(headerRow + 1, 1, lastRow - headerRow, lastCol).getValues();
  const target = sheet.getRange(headerRow + 1, 1, data.length, data[0].length);

  const rules = sheet.getConditionalFormatRules();
  sheet.setConditionalFormatRules([]);   // clear
  sheet.setConditionalFormatRules(rules); // reapply
  target.setValues(data); // force refresh
}

function generateMissingTaskIDs() {
  const sheet = getDataSheet();
  const { headerRow, col } = _getTableContext(sheet);

  const taskIdIdx = col("Task ID", "TaskID");
  if (taskIdIdx === -1) return;

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= headerRow) return;

  const tz = Session.getScriptTimeZone();
  const data = sheet.getRange(headerRow + 1, 1, lastRow - headerRow, lastCol).getValues();

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const taskId = row[taskIdIdx];
    if (!taskId || String(taskId).trim() === "") {
      const today = Utilities.formatDate(new Date(), tz, "yyyyMMdd");
      const newId = `TASK-${today}-${("000" + (i + 1)).slice(-3)}`;
      sheet.getRange(headerRow + 1 + i, taskIdIdx + 1).setValue(newId);
    }
  }
}

function onEdit(e) {
  const sheet = getDataSheet();
  if (e.range.getSheet().getName() !== sheet.getName()) return;

  const { headerRow, col } = _getTableContext(sheet);
  const row = e.range.getRow();
  if (row <= headerRow) return; // ignore header and above

  const lastModifiedIdx = col("Last Modified", "Updated", "Modified");
  const dueDateIdx = col("Due Date", "Due");
  const emailNotifiedIdx = col("Email Notified", "Notified");

  if (lastModifiedIdx !== -1) {
    sheet.getRange(row, lastModifiedIdx + 1).setValue(new Date());
  }
  if (dueDateIdx !== -1 && emailNotifiedIdx !== -1 && e.range.getColumn() === dueDateIdx + 1) {
    sheet.getRange(row, emailNotifiedIdx + 1).clearContent();
  }
}
