import { nowIso } from "../db.js";

export const VALID_PRIORITIES = ["high", "medium", "low"];
export const VALID_STATUSES = ["open", "completed", "cancelled", "postponed", "on_hold"];

export function normalizeTask(body = {}, { preserveCreatedAt = false } = {}) {
  const now = nowIso();
  const task = {
    title: String(body.title || "").trim(),
    description: String(body.description || "").trim(),
    due_date: body.due_date ? new Date(body.due_date).toISOString() : null,
    priority: VALID_PRIORITIES.includes(body.priority) ? body.priority : "medium",
    status: VALID_STATUSES.includes(body.status) ? body.status : "open",
    category: String(body.category || "").trim(),
    is_recurring: body.is_recurring ? 1 : 0,
    recurrence_rule: String(body.recurrence_rule || "").trim(),
    last_modified: now,
    created_at: preserveCreatedAt && body.created_at ? body.created_at : now
  };

  if (body.id !== undefined && body.id !== null && String(body.id).trim() !== "") {
    const id = Number(body.id);
    if (Number.isInteger(id) && id > 0) {
      task.id = id;
    }
  }

  return task;
}

export function parseNextDueDate(dueDateValue, recurrenceRule) {
  const dueDate = new Date(dueDateValue);
  if (Number.isNaN(dueDate.getTime())) return null;

  const rule = String(recurrenceRule || "").trim();
  if (!rule) return null;

  const numericDays = Number.parseInt(rule, 10);
  if (Number.isInteger(numericDays) && numericDays > 0) {
    dueDate.setDate(dueDate.getDate() + numericDays);
    return dueDate.toISOString();
  }

  const upper = rule.toUpperCase();
  const intervalMatch = upper.match(/INTERVAL=(\d+)/);
  const interval = intervalMatch ? Number.parseInt(intervalMatch[1], 10) : 1;
  const safeInterval = Number.isInteger(interval) && interval > 0 ? interval : 1;

  if (upper.includes("FREQ=DAILY")) {
    dueDate.setDate(dueDate.getDate() + safeInterval);
    return dueDate.toISOString();
  }
  if (upper.includes("FREQ=WEEKLY")) {
    dueDate.setDate(dueDate.getDate() + safeInterval * 7);
    return dueDate.toISOString();
  }
  if (upper.includes("FREQ=MONTHLY")) {
    dueDate.setMonth(dueDate.getMonth() + safeInterval);
    return dueDate.toISOString();
  }
  if (upper.includes("FREQ=YEARLY")) {
    dueDate.setFullYear(dueDate.getFullYear() + safeInterval);
    return dueDate.toISOString();
  }

  return null;
}

export function archiveTask(db, task) {
  const archived = { ...task, archived_at: nowIso() };
  db.prepare(`
    INSERT INTO archive (
      id, title, description, due_date, priority, status, category,
      is_recurring, recurrence_rule, last_modified, created_at, archived_at
    ) VALUES (
      @id, @title, @description, @due_date, @priority, @status, @category,
      @is_recurring, @recurrence_rule, @last_modified, @created_at, @archived_at
    )
  `).run(archived);

  db.prepare("DELETE FROM tasks WHERE id = ?").run(task.id);
  return archived;
}

export function createNextOccurrence(db, task) {
  if (!task.is_recurring || !task.recurrence_rule || !task.due_date) {
    return null;
  }

  const nextDue = parseNextDueDate(task.due_date, task.recurrence_rule);
  if (!nextDue) return null;

  const now = nowIso();
  const nextTask = {
    title: task.title,
    description: task.description,
    due_date: nextDue,
    priority: task.priority,
    status: "open",
    category: task.category,
    is_recurring: task.is_recurring,
    recurrence_rule: task.recurrence_rule,
    last_modified: now,
    created_at: now
  };

  const result = db.prepare(`
    INSERT INTO tasks (
      title, description, due_date, priority, status, category,
      is_recurring, recurrence_rule, last_modified, created_at
    ) VALUES (
      @title, @description, @due_date, @priority, @status, @category,
      @is_recurring, @recurrence_rule, @last_modified, @created_at
    )
  `).run(nextTask);

  return db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid);
}
