import express from "express";
import { ok } from "../lib/http.js";

const router = express.Router();

router.get("/", (req, res) => {
  const db = req.app.locals.db;
  const page = Math.max(1, Number.parseInt(req.query.page || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(req.query.pageSize || "20", 10) || 20));
  const offset = (page - 1) * pageSize;

  const total = db.prepare("SELECT COUNT(*) AS count FROM archive").get().count;
  const items = db.prepare(`
    SELECT * FROM archive
    ORDER BY archived_at DESC, id DESC
    LIMIT ? OFFSET ?
  `).all(pageSize, offset);

  return ok(res, {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    }
  });
});

export default router;
