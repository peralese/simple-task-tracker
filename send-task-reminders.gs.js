function sendTaskReminders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const today = new Date();
  const email = "erickles@us.ibm.com";  // or hardcode your email

  let tasksDueToday = [];

  // Skip header row (i = 1)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    const taskName = row[1];
    const notes = row[2];
    const dueDate = row[3];
    const status = row[4];
    const sendReminder = row[5];
    const reminderSent = row[6];

    // Check if reminder already sent or not requested
    if (!sendReminder || sendReminder.toString().toLowerCase().indexOf("yes") === -1) continue;
    if (reminderSent && reminderSent.toString().toLowerCase() === "yes") continue;

    // Compare due date to today
    if (dueDate instanceof Date &&
        dueDate.getFullYear() === today.getFullYear() &&
        dueDate.getMonth() === today.getMonth() &&
        dueDate.getDate() === today.getDate()) {

      tasksDueToday.push({
        rowIndex: i + 1,
        taskName,
        notes,
        dueDate,
        status
      });
    }
  }

  if (tasksDueToday.length === 0) return;

  // Construct email content
  let body = `<h3>📋 Task Reminders Due Today</h3><ul>`;
  tasksDueToday.forEach(task => {
    body += `<li><strong>${task.taskName}</strong> – ${task.notes || ''}</li>`;
  });
  body += `</ul>`;

  // Send the email
  GmailApp.sendEmail(email, "🕒 Task Reminder – Tasks Due Today", "", {
    htmlBody: body
  });

  // Mark as notified
  tasksDueToday.forEach(task => {
    const notifiedCol = 7; // Reminder Sent?
    const lastNotifiedCol = 8; // Last Notified
    sheet.getRange(task.rowIndex, notifiedCol).setValue("Yes");
    sheet.getRange(task.rowIndex, lastNotifiedCol).setValue(new Date());
  });
}

function sendTaskSummary() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const email = Session.getActiveUser().getEmail();

  let openTasks = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const taskName = row[1];
    const notes = row[2];
    const dueDate = row[3];
    const status = row[4];

    if (status && status.toLowerCase() !== "done") {
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
  const mainSheet = ss.getSheetByName("Tasks"); // Replace with your sheet name
  const archiveSheet = ss.getSheetByName("Archive") || ss.insertSheet("Archive");

  const data = mainSheet.getDataRange().getValues();
  const headers = data[0];
  let rowsToArchive = [];

  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];
    const status = row[4]; // Assuming Status is column E

    if (status && status.toLowerCase() === "done") {
      rowsToArchive.unshift(row); // Add to archive list
      mainSheet.deleteRow(i + 1); // +1 because sheet is 1-indexed and we have header
    }
  }

  if (rowsToArchive.length > 0) {
    // If archive is empty, add headers
    if (archiveSheet.getLastRow() === 0) {
      archiveSheet.appendRow(headers);
    }

    rowsToArchive.forEach(row => archiveSheet.appendRow(row));
  }
}
