import express from "express";
import { ok } from "../lib/http.js";

const router = express.Router();

const VALID_ARCHIVE_STATUSES = ["completed", "cancelled", "postponed"];

router.get("/", (req, res) => {
  const db = req.app.locals.db;
  const page = Math.max(1, Number.parseInt(req.query.page || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(req.query.pageSize || "20", 10) || 20));
  const offset = (page - 1) * pageSize;

  const status = VALID_ARCHIVE_STATUSES.includes(req.query.status) ? req.query.status : null;
  const whereClause = status ? "WHERE status = ?" : "";
  const bindParams = status ? [status] : [];

  const total = db.prepare(`SELECT COUNT(*) AS count FROM archive ${whereClause}`).get(...bindParams).count;
  const items = db.prepare(`
    SELECT * FROM archive
    ${whereClause}
    ORDER BY archived_at DESC, id DESC
    LIMIT ? OFFSET ?
  `).all(...bindParams, pageSize, offset);

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
