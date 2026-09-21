import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { dayStringToDate, todayDayString } from "../lib/date.js";

export const diaryRouter = Router();

function summarize(entries: { kcal: number; protein: number; carbs: number; fat: number }[]) {
  return entries.reduce(
    (acc, e) => ({
      kcal: acc.kcal + e.kcal,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

diaryRouter.get("/", async (req, res) => {
  const day = String(req.query.date ?? todayDayString());
  const date = dayStringToDate(day);

  const entries = await prisma.diaryEntry.findMany({
    where: { date },
    include: { food: true },
    orderBy: { createdAt: "asc" },
  });

  res.json({ date: day, entries, totals: summarize(entries) });
});

// Days (most recent first) that have at least one entry, with per-day totals —
// used by the history / diary list screen.
diaryRouter.get("/history", async (req, res) => {
  const limit = Math.min(Number(req.query.days ?? 30), 90);

  const entries = await prisma.diaryEntry.findMany({
    orderBy: { date: "desc" },
  });

  const byDay = new Map<string, typeof entries>();
  for (const entry of entries) {
    const key = entry.date.toISOString().slice(0, 10);
    const list = byDay.get(key) ?? [];
    list.push(entry);
    byDay.set(key, list);
  }

  const days = Array.from(byDay.entries())
    .slice(0, limit)
    .map(([date, dayEntries]) => ({ date, totals: summarize(dayEntries), entryCount: dayEntries.length }));

  res.json(days);
});

const createEntrySchema = z.object({
  foodId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  quantityG: z.number().positive(),
  unitLabel: z.string().min(1),
});

diaryRouter.post("/", async (req, res) => {
  const parsed = createEntrySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { foodId, date, mealType, quantityG, unitLabel } = parsed.data;

  const food = await prisma.food.findUnique({ where: { id: foodId } });
  if (!food) {
    return res.status(404).json({ error: "Lebensmittel nicht gefunden" });
  }

  const factor = quantityG / 100;
  const entry = await prisma.diaryEntry.create({
    data: {
      foodId,
      date: dayStringToDate(date),
      mealType,
      quantityG,
      unitLabel,
      kcal: food.kcalPer100g * factor,
      protein: food.proteinPer100g * factor,
      carbs: food.carbsPer100g * factor,
      fat: food.fatPer100g * factor,
      fiber: food.fiberPer100g !== null ? food.fiberPer100g * factor : null,
      sugar: food.sugarPer100g !== null ? food.sugarPer100g * factor : null,
    },
    include: { food: true },
  });

  res.status(201).json(entry);
});

const updateEntrySchema = z.object({
  quantityG: z.number().positive().optional(),
  unitLabel: z.string().min(1).optional(),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]).optional(),
});

diaryRouter.put("/:id", async (req, res) => {
  const parsed = updateEntrySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const existing = await prisma.diaryEntry.findUnique({
    where: { id: req.params.id },
    include: { food: true },
  });
  if (!existing) {
    return res.status(404).json({ error: "Eintrag nicht gefunden" });
  }

  const quantityG = parsed.data.quantityG ?? existing.quantityG;
  const factor = quantityG / 100;
  const food = existing.food;

  const entry = await prisma.diaryEntry.update({
    where: { id: req.params.id },
    data: {
      quantityG,
      unitLabel: parsed.data.unitLabel ?? existing.unitLabel,
      mealType: parsed.data.mealType ?? existing.mealType,
      kcal: food.kcalPer100g * factor,
      protein: food.proteinPer100g * factor,
      carbs: food.carbsPer100g * factor,
      fat: food.fatPer100g * factor,
      fiber: food.fiberPer100g !== null ? food.fiberPer100g * factor : null,
      sugar: food.sugarPer100g !== null ? food.sugarPer100g * factor : null,
    },
    include: { food: true },
  });

  res.json(entry);
});

diaryRouter.delete("/:id", async (req, res) => {
  await prisma.diaryEntry.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
