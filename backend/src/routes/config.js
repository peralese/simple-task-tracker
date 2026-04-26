import express from "express";
import { fail, ok } from "../lib/http.js";

const router = express.Router();

router.get("/", (req, res) => {
  const db = req.app.locals.db;
  const rows = db.prepare("SELECT key, value FROM app_config ORDER BY key ASC").all();
  return ok(res, Object.fromEntries(rows.map((row) => [row.key, row.value])));
});

router.put("/", (req, res) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return fail(res, 400, "Config body must be an object");
  }

  const db = req.app.locals.db;
  const stmt = db.prepare(`
    INSERT INTO app_config (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);
  const tx = db.transaction((entries) => {
    Object.entries(entries).forEach(([key, value]) => {
      stmt.run(key, value == null ? null : String(value));
    });
  });
  tx(req.body);

  const rows = db.prepare("SELECT key, value FROM app_config ORDER BY key ASC").all();
  return ok(res, Object.fromEntries(rows.map((row) => [row.key, row.value])));
});

export default router;
