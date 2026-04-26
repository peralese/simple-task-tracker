import express from "express";
import { body, validationResult } from "express-validator";
import { fail, ok } from "../lib/http.js";
import {
  archiveTask,
  createNextOccurrence,
  normalizeTask,
  VALID_PRIORITIES,
  VALID_STATUSES
} from "../lib/tasks.js";

const router = express.Router();

const createValidators = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("priority").optional().isIn(VALID_PRIORITIES).withMessage("Priority must be high, medium, or low"),
  body("status").optional().isIn(VALID_STATUSES).withMessage("Status is invalid"),
  body("due_date").optional({ nullable: true }).isISO8601().withMessage("Due date must be a valid ISO 8601 date"),
  body("is_recurring").optional().isBoolean().withMessage("is_recurring must be boolean")
];

router.get("/", (req, res) => {
  const db = req.app.locals.db;
  const clauses = ["status = 'open'"];
  const params = [];

  if (req.query.priority) {
    clauses.push("priority = ?");
    params.push(req.query.priority);
  }
  if (req.query.category) {
    clauses.push("category = ?");
    params.push(req.query.category);
  }

  const rows = db.prepare(`
    SELECT * FROM tasks
    WHERE ${clauses.join(" AND ")}
    ORDER BY due_date ASC, id ASC
  `).all(...params);

  return ok(res, rows);
});

router.get("/due-today", (req, res) => {
  const db = req.app.locals.db;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const rows = db.prepare(`
    SELECT * FROM tasks
    WHERE status = 'open'
      AND due_date IS NOT NULL
      AND due_date >= ?
      AND due_date < ?
    ORDER BY due_date ASC, id ASC
  `).all(start.toISOString(), end.toISOString());

  return ok(res, rows);
});

router.post("/", createValidators, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, errors.array().map((entry) => entry.msg).join(", "));
  }

  const db = req.app.locals.db;
  const task = normalizeTask(req.body);

  let result;
  if (task.id) {
    result = db.prepare(`
      INSERT INTO tasks (
        id, title, description, due_date, priority, status, category,
        is_recurring, recurrence_rule, last_modified, created_at
      ) VALUES (
        @id, @title, @description, @due_date, @priority, @status, @category,
        @is_recurring, @recurrence_rule, @last_modified, @created_at
      )
    `).run(task);
  } else {
    result = db.prepare(`
      INSERT INTO tasks (
        title, description, due_date, priority, status, category,
        is_recurring, recurrence_rule, last_modified, created_at
      ) VALUES (
        @title, @description, @due_date, @priority, @status, @category,
        @is_recurring, @recurrence_rule, @last_modified, @created_at
      )
    `).run(task);
  }

  const insertedId = task.id || result.lastInsertRowid;
  return ok(res, db.prepare("SELECT * FROM tasks WHERE id = ?").get(insertedId), 201);
});

router.put("/:id", (req, res) => {
  const db = req.app.locals.db;
  const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
  if (!existing) {
    return fail(res, 404, "Task not found");
  }

  const next = normalizeTask(
    { ...existing, ...req.body, created_at: existing.created_at },
    { preserveCreatedAt: true }
  );

  db.prepare(`
    UPDATE tasks SET
      title = @title,
      description = @description,
      due_date = @due_date,
      priority = @priority,
      status = @status,
      category = @category,
      is_recurring = @is_recurring,
      recurrence_rule = @recurrence_rule,
      last_modified = @last_modified
    WHERE id = @id
  `).run({
    ...next,
    id: existing.id
  });

  return ok(res, db.prepare("SELECT * FROM tasks WHERE id = ?").get(existing.id));
});

router.delete("/:id", (req, res) => {
  const db = req.app.locals.db;
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
  if (!task) {
    return fail(res, 404, "Task not found");
  }

  const archived = archiveTask(db, task);
  const nextOccurrence = createNextOccurrence(db, task);

  return ok(res, {
    archived,
    next_occurrence: nextOccurrence
  });
});

export default router;
