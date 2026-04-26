import express from "express";
import { ok } from "../lib/http.js";
import { runDailyNotifications } from "../scheduler.js";

const router = express.Router();

router.post("/send-now", async (req, res, next) => {
  try {
    const result = await runDailyNotifications(req.app.locals.db);
    return ok(res, result);
  } catch (error) {
    return next(error);
  }
});

export default router;
