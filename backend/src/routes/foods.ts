import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { searchFoods, findByBarcode, createManualFood } from "../services/foodService.js";

export const foodsRouter = Router();

foodsRouter.get("/search", async (req, res) => {
  const query = String(req.query.q ?? "");
  if (!query.trim()) {
    return res.json({ foods: [], errors: [] });
  }

  const result = await searchFoods(query);
  res.json(result);
});

foodsRouter.get("/barcode/:code", async (req, res) => {
  const result = await findByBarcode(req.params.code);
  if (!result.food) {
    return res.status(404).json({ error: "Produkt nicht gefunden", errors: result.errors });
  }
  res.json(result);
});

foodsRouter.get("/favorites", async (_req, res) => {
  const favorites = await prisma.favorite.findMany({
    include: { food: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(favorites.map((f) => f.food));
});

foodsRouter.get("/recent", async (_req, res) => {
  const recentEntries = await prisma.diaryEntry.findMany({
    include: { food: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const seen = new Set<string>();
  const recentFoods = [];
  for (const entry of recentEntries) {
    if (seen.has(entry.foodId)) continue;
    seen.add(entry.foodId);
    recentFoods.push(entry.food);
    if (recentFoods.length >= 15) break;
  }
  res.json(recentFoods);
});

foodsRouter.post("/favorites/:foodId", async (req, res) => {
  const favorite = await prisma.favorite.upsert({
    where: { foodId: req.params.foodId },
    create: { foodId: req.params.foodId },
    update: {},
  });
  res.json(favorite);
});

foodsRouter.delete("/favorites/:foodId", async (req, res) => {
  await prisma.favorite.deleteMany({ where: { foodId: req.params.foodId } });
  res.status(204).end();
});

const manualFoodSchema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  barcode: z.string().optional(),
  servingSizeG: z.number().positive().optional(),
  servingLabel: z.string().optional(),
  kcalPer100g: z.number().min(0),
  proteinPer100g: z.number().min(0),
  carbsPer100g: z.number().min(0),
  fatPer100g: z.number().min(0),
  fiberPer100g: z.number().min(0).optional(),
  sugarPer100g: z.number().min(0).optional(),
});

foodsRouter.post("/", async (req, res) => {
  const parsed = manualFoodSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const food = await createManualFood(parsed.data);
  res.status(201).json(food);
});
