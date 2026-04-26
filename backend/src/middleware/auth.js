import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { fail } from "../lib/http.js";

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function comparePassphrase(passphrase, expectedValue) {
  if (!expectedValue) return false;
  const normalized = String(expectedValue).trim();
  if (/^[a-f0-9]{64}$/i.test(normalized)) {
    return sha256(passphrase) === normalized.toLowerCase();
  }
  return passphrase === normalized;
}

export function signToken() {
  return jwt.sign(
    { sub: "single-user" },
    process.env.JWT_SECRET || "change-me",
    { expiresIn: "24h" }
  );
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return fail(res, 401, "Missing or invalid Bearer token");
  }

  try {
    req.auth = jwt.verify(token, process.env.JWT_SECRET || "change-me");
    return next();
  } catch (_error) {
    return fail(res, 401, "Invalid or expired token");
  }
}
