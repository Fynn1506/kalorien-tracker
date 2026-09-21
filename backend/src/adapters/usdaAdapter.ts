import type { FoodSource, NormalizedFood } from "../types/food.js";

const BASE_URL = "https://api.nal.usda.gov/fdc/v1";

// USDA FoodData Central nutrient IDs we care about.
const NUTRIENT_IDS = {
  KCAL: 1008,
  PROTEIN: 1003,
  CARBS: 1005,
  FAT: 1004,
  FIBER: 1079,
  SUGAR: 2000,
};

interface UsdaFoodNutrient {
  nutrientId?: number;
  nutrientName?: string;
  value?: number;
}

interface UsdaFood {
  fdcId: number;
  description: string;
  brandOwner?: string;
  gtinUpc?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients: UsdaFoodNutrient[];
}

function nutrientValue(food: UsdaFood, nutrientId: number): number | undefined {
  return food.foodNutrients.find((n) => n.nutrientId === nutrientId)?.value;
}

function mapFood(food: UsdaFood): NormalizedFood | null {
  const kcal = nutrientValue(food, NUTRIENT_IDS.KCAL);
  if (kcal === undefined) return null;

  return {
    source: "usda",
    sourceId: String(food.fdcId),
    barcode: food.gtinUpc,
    name: food.description,
    brand: food.brandOwner,
    servingSizeG:
      food.servingSizeUnit?.toLowerCase() === "g" ? food.servingSize : undefined,
    per100g: {
      kcal,
      protein: nutrientValue(food, NUTRIENT_IDS.PROTEIN) ?? 0,
      carbs: nutrientValue(food, NUTRIENT_IDS.CARBS) ?? 0,
      fat: nutrientValue(food, NUTRIENT_IDS.FAT) ?? 0,
      fiber: nutrientValue(food, NUTRIENT_IDS.FIBER),
      sugar: nutrientValue(food, NUTRIENT_IDS.SUGAR),
    },
  };
}

function apiKey(): string {
  return process.env.USDA_FDC_API_KEY ?? "";
}

export const usdaAdapter: FoodSource = {
  name: "usda",

  isConfigured() {
    return apiKey().length > 0;
  },

  async search(query: string): Promise<NormalizedFood[]> {
    if (!this.isConfigured()) return [];

    const url = new URL(`${BASE_URL}/foods/search`);
    url.searchParams.set("api_key", apiKey());
    url.searchParams.set("query", query);
    url.searchParams.set("pageSize", "20");
    url.searchParams.set("dataType", "Branded,Foundation,SR Legacy");

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`USDA search failed: ${res.status}`);
    }

    const data = (await res.json()) as { foods?: UsdaFood[] };
    return (data.foods ?? [])
      .map(mapFood)
      .filter((food): food is NormalizedFood => food !== null);
  },

  async getByBarcode(barcode: string): Promise<NormalizedFood | null> {
    if (!this.isConfigured()) return null;

    // USDA has no dedicated barcode endpoint; the GTIN/UPC is searchable as free text
    // and returned in gtinUpc, so search and filter for an exact match.
    const url = new URL(`${BASE_URL}/foods/search`);
    url.searchParams.set("api_key", apiKey());
    url.searchParams.set("query", barcode);
    url.searchParams.set("pageSize", "5");
    url.searchParams.set("dataType", "Branded");

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`USDA barcode lookup failed: ${res.status}`);
    }

    const data = (await res.json()) as { foods?: UsdaFood[] };
    const match = (data.foods ?? []).find((f) => f.gtinUpc === barcode);
    return match ? mapFood(match) : null;
  },
};
