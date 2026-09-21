import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { dateToDayString } from "../lib/date.js";

export const statsRouter = Router();

// Daily kcal/macro totals for the last N days (oldest -> newest), zero-filled
// for days without entries, for the statistics chart.
statsRouter.get("/daily", async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days ?? 7), 1), 90);

  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const entries = await prisma.diaryEntry.findMany({
    where: { date: { gte: start, lte: end } },
  });

  const totalsByDay = new Map<string, { kcal: number; protein: number; carbs: number; fat: number }>();
  for (const entry of entries) {
    const key = dateToDayString(entry.date);
    const current = totalsByDay.get(key) ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    current.kcal += entry.kcal;
    current.protein += entry.protein;
    current.carbs += entry.carbs;
    current.fat += entry.fat;
    totalsByDay.set(key, current);
  }

  const result = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    const key = dateToDayString(d);
    result.push({ date: key, ...(totalsByDay.get(key) ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 }) });
  }

  res.json(result);
});
