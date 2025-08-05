function sendTaskReminders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const today = new Date();
  const email = "erickles@us.ibm.com";  // hardcoded recipient

  let tasksDueToday = [];

  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    const taskName = row[1];         // Column B
    const notes = row[2];            // Column C
    const dueDate = row[3];          // Column D
    const status = row[4];           // Column E
    const sendReminder = row[5];     // Column F – "Yes, send me a reminder for this task"
    const emailNotified = row[9];    // Column J – previously recorded timestamp

    // Only process tasks where reminder is requested
    if (!sendReminder || sendReminder.toString().toLowerCase().indexOf("yes") === -1) continue;

    // Only process if reminder hasn't already been sent
    if (emailNotified && emailNotified !== "") continue;

    // Match due date to today
    if (dueDate instanceof Date &&
        dueDate.getFullYear() === today.getFullYear() &&
        dueDate.getMonth() === today.getMonth() &&
        dueDate.getDate() === today.getDate()) {

      tasksDueToday.push({
        rowIndex: i + 1,
        taskName,
        notes
      });
    }
  }

  if (tasksDueToday.length === 0) return;

  // Build email body
  let body = `<h3>📋 Task Reminders Due Today</h3><ul>`;
  tasksDueToday.forEach(task => {
    body += `<li><strong>${task.taskName}</strong> – ${task.notes || ''}</li>`;
  });
  body += `</ul>`;

  // Send email
  GmailApp.sendEmail(email, "🕒 Task Reminder – Tasks Due Today", "", {
    htmlBody: body
  });

  // Mark tasks as notified (write timestamp to Column J)
  tasksDueToday.forEach(task => {
    const emailNotifiedCol = 10; // Column J
    sheet.getRange(task.rowIndex, emailNotifiedCol).setValue(new Date());
  });
}

function sendTaskSummary() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const email = "erickles@us.ibm.com";

  let openTasks = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const taskName = row[1];
    const notes = row[2];
    const dueDate = row[3];
    const status = row[4];

    if (status && status.toLowerCase() !== "complete") {
      openTasks.push({
        taskName,
        notes,
        dueDate: dueDate instanceof Date ? Utilities.formatDate(dueDate, Session.getScriptTimeZone(), "yyyy-MM-dd") : dueDate,
        status
      });
    }
  }

  if (openTasks.length === 0) return;

  let body = `<h3>🗂️ Daily Task Summary – Open Tasks</h3><table border="1" cellpadding="4" cellspacing="0"><tr><th>Task</th><th>Notes</th><th>Due Date</th><th>Status</th></tr>`;

  openTasks.forEach(task => {
    body += `<tr><td>${task.taskName}</td><td>${task.notes || ""}</td><td>${task.dueDate}</td><td>${task.status}</td></tr>`;
  });

  body += `</table>`;

  GmailApp.sendEmail(email, "🗓️ Daily Task Summary", "", {
    htmlBody: body
  });
}

function archiveCompletedTasks() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mainSheet = ss.getSheetByName("Form Responses 1"); // Update this if needed
  const archiveSheet = ss.getSheetByName("Archive") || ss.insertSheet("Archive");

  const data = mainSheet.getDataRange().getValues();
  const headers = data[0];
  const statusColIndex = 4; // Column E = Status
  const dateArchivedLabel = "Date Archived";

  // Ensure Archive sheet has headers
  let archiveHeaders = [];
  const lastCol = archiveSheet.getLastColumn();

  if (lastCol > 0) {
    archiveHeaders = archiveSheet.getRange(1, 1, 1, lastCol).getValues()[0];
  }

  // Add "Date Archived" header if missing
  if (!archiveHeaders.includes(dateArchivedLabel)) {
    archiveSheet.getRange(1, archiveHeaders.length + 1).setValue(dateArchivedLabel);
    archiveHeaders = archiveSheet.getRange(1, 1, 1, archiveSheet.getLastColumn()).getValues()[0];
  }

  const dateArchivedCol = archiveHeaders.indexOf(dateArchivedLabel);

  let rowsToArchive = [];

  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];
    const status = row[statusColIndex];

    if (status && status.toLowerCase() === "complete") {
      const rowWithArchiveDate = [...row];

      // Ensure the row has enough columns for archive date
      while (rowWithArchiveDate.length <= dateArchivedCol) {
        rowWithArchiveDate.push("");
      }

      rowWithArchiveDate[dateArchivedCol] = new Date(); // Add archive timestamp
      rowsToArchive.unshift(rowWithArchiveDate);        // Add to top of archive list

      mainSheet.deleteRow(i + 1); // Delete from main sheet
    }
  }

  // Write headers if archive sheet is completely empty
  if (archiveSheet.getLastRow() === 0) {
    const fullHeaders = [...headers];

    while (fullHeaders.length <= dateArchivedCol) {
      fullHeaders.push("");
    }

    fullHeaders[dateArchivedCol] = dateArchivedLabel;
    archiveSheet.appendRow(fullHeaders);
  }

  // Append archived tasks
  rowsToArchive.forEach(row => archiveSheet.appendRow(row));
}



function onFormSubmit(e) {
  generateMissingTaskIDs();
  reapplyFormattingWithRefresh();
}

function reapplyFormattingWithRefresh() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form Responses 1"); // replace if needed
  if (!sheet) throw new Error("Sheet not found.");

  const range = sheet.getDataRange();
  const rules = sheet.getConditionalFormatRules();

  // Reapply the formatting rules (this alone doesn't trigger a refresh)
  sheet.setConditionalFormatRules([]);
  sheet.setConditionalFormatRules(rules);

  // Get all values excluding header
  const data = range.getValues();
  if (data.length <= 1) return; // no rows to reprocess

  const dataOnly = data.slice(1); // exclude header
  const targetRange = sheet.getRange(2, 1, dataOnly.length, dataOnly[0].length);

  // Re-write values to force conditional formatting refresh
  targetRange.setValues(dataOnly);
}
function generateMissingTaskIDs() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form Responses 1"); // update sheet name if needed
  if (!sheet) throw new Error("Sheet not found.");

  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();

  const header = values[0];
  const taskIdColIndex = header.indexOf("Task ID");
  if (taskIdColIndex === -1) throw new Error("Task ID column not found.");

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const taskId = row[taskIdColIndex];

    if (!taskId || taskId.toString().trim() === "") {
      const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd");
      const newId = `TASK-${today}-${("000" + (i + 1)).slice(-3)}`; // pad row number

      sheet.getRange(i + 1, taskIdColIndex + 1).setValue(newId);
    }
  }
}
function onEdit(e) {
  const sheet = e.source.getSheetByName("Form Responses 1"); // Replace with your sheet name
  if (!sheet) return;

  const editedRange = e.range;
  const row = editedRange.getRow();
  const col = editedRange.getColumn();

  if (row === 1) return; // Skip header row

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const lastModifiedColIndex = headers.indexOf("Last Modified");

  if (lastModifiedColIndex === -1) return;

  // Update the "Last Modified" column for that row
  sheet.getRange(row, lastModifiedColIndex + 1).setValue(new Date());
}