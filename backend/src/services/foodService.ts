import type { Food } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import type { FoodSource, NormalizedFood } from "../types/food.js";
import { openFoodFactsAdapter } from "../adapters/openFoodFactsAdapter.js";
import { usdaAdapter } from "../adapters/usdaAdapter.js";
import { fatSecretAdapter } from "../adapters/fatSecretAdapter.js";

// Order matters: local cache is checked separately (it's a DB read, not an
// adapter call); these run afterwards, in priority order, as long as an
// earlier one hasn't already produced enough results.
const REMOTE_SOURCES: FoodSource[] = [openFoodFactsAdapter, usdaAdapter, fatSecretAdapter];
const MIN_RESULTS_BEFORE_FALLBACK = 5;

export interface SourceError {
  source: string;
  message: string;
}

export interface SearchResult {
  foods: Food[];
  errors: SourceError[];
}

function dedupeKey(food: { barcode?: string | null; name: string; brand?: string | null }): string {
  if (food.barcode) return `barcode:${food.barcode}`;
  return `name:${food.name.trim().toLowerCase()}|${food.brand?.trim().toLowerCase() ?? ""}`;
}

async function upsertNormalizedFood(food: NormalizedFood): Promise<Food> {
  const data = {
    source: food.source,
    sourceId: food.sourceId,
    barcode: food.barcode,
    name: food.name,
    nameNormalized: food.name.toLowerCase(),
    brand: food.brand,
    servingSizeG: food.servingSizeG,
    servingLabel: food.servingLabel,
    kcalPer100g: food.per100g.kcal,
    proteinPer100g: food.per100g.protein,
    carbsPer100g: food.per100g.carbs,
    fatPer100g: food.per100g.fat,
    fiberPer100g: food.per100g.fiber,
    sugarPer100g: food.per100g.sugar,
  };

  return prisma.food.upsert({
    where: { source_sourceId: { source: food.source, sourceId: food.sourceId } },
    create: data,
    update: data,
  });
}

export async function searchFoods(query: string): Promise<SearchResult> {
  const trimmed = query.trim();
  if (!trimmed) return { foods: [], errors: [] };

  const normalizedQuery = trimmed.toLowerCase();
  const errors: SourceError[] = [];
  const results = new Map<string, Food>();

  const cached = await prisma.food.findMany({
    where: { nameNormalized: { contains: normalizedQuery } },
    take: 20,
  });
  for (const food of cached) {
    results.set(dedupeKey(food), food);
  }

  for (const source of REMOTE_SOURCES) {
    if (results.size >= MIN_RESULTS_BEFORE_FALLBACK) break;
    if (!source.isConfigured()) continue;

    try {
      const remoteFoods = await source.search(trimmed);
      for (const normalized of remoteFoods) {
        const key = dedupeKey(normalized);
        if (results.has(key)) continue; // already found via an earlier/cached source
        const saved = await upsertNormalizedFood(normalized);
        results.set(key, saved);
      }
    } catch (err) {
      errors.push({ source: source.name, message: (err as Error).message });
    }
  }

  return { foods: Array.from(results.values()), errors };
}

export async function findByBarcode(barcode: string): Promise<{ food: Food | null; errors: SourceError[] }> {
  const errors: SourceError[] = [];

  const cached = await prisma.food.findFirst({ where: { barcode } });
  if (cached) return { food: cached, errors };

  for (const source of REMOTE_SOURCES) {
    if (!source.isConfigured()) continue;
    try {
      const normalized = await source.getByBarcode(barcode);
      if (normalized) {
        const saved = await upsertNormalizedFood(normalized);
        return { food: saved, errors };
      }
    } catch (err) {
      errors.push({ source: source.name, message: (err as Error).message });
    }
  }

  return { food: null, errors };
}

export async function createManualFood(input: {
  name: string;
  brand?: string;
  barcode?: string;
  servingSizeG?: number;
  servingLabel?: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
  sugarPer100g?: number;
}): Promise<Food> {
  return prisma.food.create({
    data: {
      source: "manual",
      sourceId: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      nameNormalized: input.name.toLowerCase(),
      ...input,
    },
  });
}
