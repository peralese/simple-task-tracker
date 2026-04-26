import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { getDb, initDb } from "./db.js";
import { configurePush } from "./push.js";
import { startScheduler } from "./scheduler.js";
import { fail, ok } from "./lib/http.js";
import { requireAuth } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import taskRoutes from "./routes/tasks.js";
import archiveRoutes from "./routes/archive.js";
import pushRoutes from "./routes/push.js";
import configRoutes from "./routes/config.js";
import notificationRoutes from "./routes/notifications.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

initDb();
configurePush();

const db = getDb();
const app = express();
const port = Number(process.env.PORT || 3001);
const frontendDistDir = path.resolve(__dirname, "../../frontend/dist");
const hasBuiltFrontend = fs.existsSync(frontendDistDir);

app.use(cors());
app.use(express.json());
app.locals.db = db;

if (hasBuiltFrontend) {
  app.use(express.static(frontendDistDir));
  app.get("*", (req, res, next) => {
    if (req.method !== "GET") {
      return next();
    }

    if (
      req.path.startsWith("/auth") ||
      req.path.startsWith("/tasks") ||
      req.path.startsWith("/archive") ||
      req.path.startsWith("/push") ||
      req.path.startsWith("/config") ||
      req.path.startsWith("/notifications") ||
      req.path === "/health"
    ) {
      return next();
    }

    return res.sendFile(path.join(frontendDistDir, "index.html"));
  });
}

app.get("/health", (_req, res) => ok(res, { ok: true }));
app.use("/auth", authRoutes);
app.use(requireAuth);
app.use("/tasks", taskRoutes);
app.use("/archive", archiveRoutes);
app.use("/push", pushRoutes);
app.use("/config", configRoutes);
app.use("/notifications", notificationRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  return fail(res, 500, "Internal server error");
});

app.use((_req, res) => fail(res, 404, "Route not found"));

startScheduler(db);

app.listen(port, () => {
  console.log(`backend listening on http://localhost:${port}`);
});
