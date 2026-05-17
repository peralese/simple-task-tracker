import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "task-app.db"));
db.pragma("journal_mode = WAL");

const TASK_SCHEMA = `
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  due_date TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT NOT NULL CHECK (status IN ('open', 'completed', 'cancelled', 'postponed', 'on_hold')),
  category TEXT DEFAULT '',
  is_recurring INTEGER NOT NULL DEFAULT 0,
  recurrence_rule TEXT DEFAULT '',
  last_modified TEXT NOT NULL,
  created_at TEXT NOT NULL
`;

export function nowIso() {
  return new Date().toISOString();
}

export function getDb() {
  return db;
}

function migrateAddOnHold(db) {
  const row = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='tasks'").get();
  if (!row || row.sql.includes("on_hold")) return;

  db.exec(`
    ALTER TABLE tasks RENAME TO tasks_old;
    CREATE TABLE tasks (${TASK_SCHEMA});
    INSERT INTO tasks SELECT * FROM tasks_old;
    DROP TABLE tasks_old;

    ALTER TABLE archive RENAME TO archive_old;
    CREATE TABLE archive (${TASK_SCHEMA}, archived_at TEXT NOT NULL);
    INSERT INTO archive SELECT * FROM archive_old;
    DROP TABLE archive_old;
  `);

  console.log("[db] migrated: added on_hold to status enum in tasks and archive");
}

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      ${TASK_SCHEMA}
    );

    CREATE TABLE IF NOT EXISTS archive (
      ${TASK_SCHEMA},
      archived_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_config (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  migrateAddOnHold(db);

  const count = db.prepare("SELECT COUNT(*) AS count FROM tasks").get().count;
  if (count === 0) {
    seedSampleTasks();
  }
}

function seedSampleTasks() {
  const insert = db.prepare(`
    INSERT INTO tasks (
      title, description, due_date, priority, status, category,
      is_recurring, recurrence_rule, last_modified, created_at
    ) VALUES (
      @title, @description, @due_date, @priority, @status, @category,
      @is_recurring, @recurrence_rule, @last_modified, @created_at
    )
  `);

  const created_at = nowIso();
  const rows = [
    {
      title: "Review weekly priorities",
      description: "Set top priorities for the next work session.",
      due_date: new Date(Date.now() + 86400000).toISOString(),
      priority: "high",
      status: "open",
      category: "Planning",
      is_recurring: 1,
      recurrence_rule: "FREQ=WEEKLY;INTERVAL=1",
      last_modified: created_at,
      created_at
    },
    {
      title: "Pay utility bill",
      description: "Electric bill due this week.",
      due_date: new Date(Date.now() + 2 * 86400000).toISOString(),
      priority: "medium",
      status: "open",
      category: "Personal",
      is_recurring: 0,
      recurrence_rule: "",
      last_modified: created_at,
      created_at
    },
    {
      title: "Archive paperwork",
      description: "Scan and store old documents.",
      due_date: new Date(Date.now() + 5 * 86400000).toISOString(),
      priority: "low",
      status: "postponed",
      category: "Admin",
      is_recurring: 0,
      recurrence_rule: "",
      last_modified: created_at,
      created_at
    }
  ];

  const tx = db.transaction((items) => {
    items.forEach((item) => insert.run(item));
  });
  tx(rows);
}
