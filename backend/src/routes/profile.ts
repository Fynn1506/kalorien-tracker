import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { calculateGoals } from "../services/calorieService.js";

export const profileRouter = Router();

const profileSchema = z.object({
  age: z.number().int().min(10).max(120),
  sex: z.enum(["MALE", "FEMALE"]),
  weightKg: z.number().min(20).max(400),
  heightCm: z.number().min(100).max(250),
  activityLevel: z.enum(["SEDENTARY", "LIGHT", "MODERATE", "ACTIVE", "VERY_ACTIVE"]),
  goal: z.enum(["LOSE", "MAINTAIN", "GAIN"]),
});

profileRouter.get("/", async (_req, res) => {
  const profile = await prisma.profile.findUnique({ where: { id: 1 } });
  res.json(profile);
});

profileRouter.post("/", async (req, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const goals = calculateGoals(parsed.data);

  const profile = await prisma.profile.upsert({
    where: { id: 1 },
    create: { id: 1, ...parsed.data, ...goals },
    update: { ...parsed.data, ...goals },
  });

  res.json(profile);
});
