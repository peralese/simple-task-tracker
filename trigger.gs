/** ============================================================================
 * Task Tracker – Trigger installer
 * Run ensureDailyTriggers() ONCE to create idempotent, time-based triggers.
 * You can also use the custom menu: Extensions → Task App → Install daily triggers
 * ========================================================================== */

function ensureDailyTriggers() {
  const plans = [
    // Adjust times (24h) to your preference; uses spreadsheet timezone.
    { func: "archiveCompletedTasks", hour: 6, minute: 15 }, // handles recurrence + archive
    { func: "sendTaskSummary",       hour: 7, minute:  0 }, // weekday-only summary
    { func: "sendTaskReminders",     hour: 7, minute: 15 }, // day-of reminders
  ];

  const existing = ScriptApp.getProjectTriggers();
  const has = (name) => existing.some((t) => t.getHandlerFunction() === name);

  plans.forEach(({ func, hour, minute }) => {
    if (!has(func)) {
      ScriptApp.newTrigger(func)
        .timeBased()
        .atHour(hour)
        .nearMinute(minute)
        .everyDays(1)
        .create();
    }
  });
}

/** Optional helper: list triggers in Logs */
function listTriggers() {
  ScriptApp.getProjectTriggers().forEach((t) =>
    Logger.log(`${t.getHandlerFunction()} – ${t.getEventType()}`)
  );
}

/** Optional helper: remove all time-based triggers created for this project */
function clearTimeBasedTriggers() {
  ScriptApp.getProjectTriggers().forEach((t) => {
    if (t.getEventType() === ScriptApp.EventType.CLOCK) {
      ScriptApp.deleteTrigger(t);
    }
  });
}

/** Nice-to-have: menu to (re)install triggers from the Sheet UI */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Task App")
    .addItem("Install daily triggers", "ensureDailyTriggers")
    .addItem("List triggers (Logs)", "listTriggers")
    .addItem("Clear time-based triggers", "clearTimeBasedTriggers")
    .addToUi();
}
