import express from "express";
import { comparePassphrase, signToken } from "../middleware/auth.js";
import { fail, ok } from "../lib/http.js";

const router = express.Router();

router.post("/login", (req, res) => {
  const passphrase = String(req.body?.passphrase || "");
  if (!passphrase) {
    return fail(res, 400, "Passphrase is required");
  }

  const db = req.app.locals.db;
  const row = db.prepare("SELECT value FROM app_config WHERE key = ?").get("auth_hash");
  const expected = row?.value || process.env.PASSPHRASE_HASH || "";

  if (!comparePassphrase(passphrase, expected)) {
    return fail(res, 401, "Invalid passphrase");
  }

  return ok(res, {
    token: signToken(),
    expires_in: "24h"
  });
});

export default router;
