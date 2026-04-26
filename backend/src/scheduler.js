import cron from "node-cron";
import { pushConfigured, sendPush } from "./push.js";

const DEFAULT_TIMEZONE = process.env.TZ || "America/Chicago";

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function isPaused(db) {
  const row = db.prepare("SELECT value FROM app_config WHERE key = ?").get("pause_until");
  if (!row?.value) return false;

  const pauseUntil = new Date(row.value);
  if (Number.isNaN(pauseUntil.getTime())) return false;

  const today = startOfToday();
  pauseUntil.setHours(0, 0, 0, 0);
  return today.getTime() < pauseUntil.getTime();
}

function dueTodayTasks(db) {
  const start = startOfToday();
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return db.prepare(`
    SELECT * FROM tasks
    WHERE status = 'open'
      AND due_date IS NOT NULL
      AND due_date >= ?
      AND due_date < ?
    ORDER BY due_date ASC, id ASC
  `).all(start.toISOString(), end.toISOString());
}

function overdueTasks(db) {
  const start = startOfToday();

  return db.prepare(`
    SELECT * FROM tasks
    WHERE status = 'open'
      AND due_date IS NOT NULL
      AND due_date < ?
    ORDER BY due_date ASC, id ASC
  `).all(start.toISOString());
}

function summarizeTitles(tasks) {
  return tasks.map((task) => task.title).filter(Boolean).slice(0, 6).join(", ");
}

async function sendGroupedPush(db, payload) {
  const subscriptions = db.prepare("SELECT id, subscription_json FROM push_subscriptions").all();
  if (subscriptions.length === 0) {
    return { attempted: 0, sent: 0, removed: 0 };
  }

  let sent = 0;
  let removed = 0;

  for (const row of subscriptions) {
    try {
      await sendPush(JSON.parse(row.subscription_json), payload);
      sent += 1;
    } catch (error) {
      if (error?.statusCode === 404 || error?.statusCode === 410) {
        db.prepare("DELETE FROM push_subscriptions WHERE id = ?").run(row.id);
        removed += 1;
      } else {
        console.error("push send failed", error);
      }
    }
  }

  return {
    attempted: subscriptions.length,
    sent,
    removed
  };
}

export async function runDailyNotifications(db) {
  const runAt = new Date().toISOString();

  if (isPaused(db)) {
    const result = {
      runAt,
      skipped: true,
      reason: "pause_until is in the future",
      dueTodayCount: 0,
      overdueCount: 0,
      notifications: []
    };
    console.log(`[scheduler] ${runAt} skipped: ${result.reason}`);
    return result;
  }

  if (!pushConfigured()) {
    const result = {
      runAt,
      skipped: true,
      reason: "web push not configured",
      dueTodayCount: 0,
      overdueCount: 0,
      notifications: []
    };
    console.log(`[scheduler] ${runAt} skipped: ${result.reason}`);
    return result;
  }

  const dueToday = dueTodayTasks(db);
  const overdue = overdueTasks(db);
  const notifications = [];

  if (dueToday.length > 0) {
    notifications.push({
      type: "due_today",
      ...(await sendGroupedPush(db, {
        title: `You have ${dueToday.length} task${dueToday.length === 1 ? "" : "s"} due today`,
        body: summarizeTitles(dueToday) || "Tasks due today",
        url: "/"
      }))
    });
  }

  if (overdue.length > 0) {
    notifications.push({
      type: "overdue",
      ...(await sendGroupedPush(db, {
        title: `${overdue.length} overdue task${overdue.length === 1 ? "" : "s"}`,
        body: summarizeTitles(overdue) || "Open overdue tasks",
        url: "/"
      }))
    });
  }

  const result = {
    runAt,
    skipped: false,
    reason: null,
    dueTodayCount: dueToday.length,
    overdueCount: overdue.length,
    notifications
  };

  console.log(
    `[scheduler] ${runAt} completed: dueToday=${dueToday.length}, overdue=${overdue.length}, notifications=${notifications.length}`
  );

  return result;
}

export function startScheduler(db) {
  cron.schedule(
    "0 8 * * *",
    async () => {
      await runDailyNotifications(db);
    },
    { timezone: DEFAULT_TIMEZONE }
  );

  console.log(`[scheduler] daily notifications scheduled for 08:00 (${DEFAULT_TIMEZONE})`);
}
