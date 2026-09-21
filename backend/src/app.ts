import express from "express";
import cors from "cors";
import { profileRouter } from "./routes/profile.js";
import { foodsRouter } from "./routes/foods.js";
import { diaryRouter } from "./routes/diary.js";
import { statsRouter } from "./routes/stats.js";

export function createApp() {
  const app = express();

  // CORS_ORIGIN can be a single origin or a comma-separated list (e.g. the
  // GitHub Pages URL). Left unset, everything is allowed, which is fine for
  // local dev but should be restricted once a public frontend origin exists.
  const allowedOrigins = process.env.CORS_ORIGIN?.split(",").map((o) => o.trim());
  app.use(cors(allowedOrigins ? { origin: allowedOrigins } : undefined));
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/profile", profileRouter);
  app.use("/api/foods", foodsRouter);
  app.use("/api/diary", diaryRouter);
  app.use("/api/stats", statsRouter);

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Interner Serverfehler" });
  });

  return app;
}
