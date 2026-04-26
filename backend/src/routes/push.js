import express from "express";
import { nowIso } from "../db.js";
import { fail, ok } from "../lib/http.js";
import { pushConfigured, sendPush } from "../push.js";

const router = express.Router();

router.post("/subscribe", (req, res) => {
  if (!req.body?.endpoint) {
    return fail(res, 400, "Invalid subscription object");
  }

  const db = req.app.locals.db;
  db.prepare(`
    INSERT INTO push_subscriptions (subscription_json, created_at)
    VALUES (?, ?)
  `).run(JSON.stringify(req.body), nowIso());

  return ok(res, { subscribed: true }, 201);
});

router.post("/test", async (req, res) => {
  if (!pushConfigured()) {
    return fail(res, 400, "Web push is not configured");
  }

  const db = req.app.locals.db;
  const rows = db.prepare("SELECT id, subscription_json FROM push_subscriptions").all();
  let sentCount = 0;
  let removedCount = 0;

  for (const row of rows) {
    try {
      await sendPush(JSON.parse(row.subscription_json), {
        title: "Task App test notification",
        body: "Push notifications are configured correctly."
      });
      sentCount += 1;
    } catch (error) {
      if (error?.statusCode === 404 || error?.statusCode === 410) {
        db.prepare("DELETE FROM push_subscriptions WHERE id = ?").run(row.id);
        removedCount += 1;
      } else {
        return fail(res, 502, `Push send failed for subscription ${row.id}`);
      }
    }
  }

  return ok(res, {
    sent_count: sentCount,
    removed_count: removedCount
  });
});

export default router;
