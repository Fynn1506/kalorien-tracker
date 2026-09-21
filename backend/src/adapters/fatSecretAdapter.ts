import type { FoodSource, NormalizedFood } from "../types/food.js";

// Skeleton adapter: structurally complete (OAuth2 + REST calls) but NOT verified
// against a live FatSecret account, since no keys were available at build time.
// Get credentials at https://platform.fatsecret.com/ and set them in .env, then
// sanity-check the response shapes below against the current FatSecret docs
// (Platform API "foods.search" / "food.get.v4" / "food/barcode/find-by-id.v1").

const TOKEN_URL = "https://oauth.fatsecret.com/connect/token";
const API_BASE = "https://platform.fatsecret.com/rest";

let cachedToken: { value: string; expiresAt: number } | null = null;

function clientId(): string {
  return process.env.FATSECRET_CLIENT_ID ?? "";
}
function clientSecret(): string {
  return process.env.FATSECRET_CLIENT_SECRET ?? "";
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId()}:${clientSecret()}`).toString("base64")}`,
    },
    body: new URLSearchParams({ grant_type: "client_credentials", scope: "basic" }),
  });

  if (!res.ok) {
    throw new Error(`FatSecret OAuth token request failed: ${res.status}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.value;
}

interface FatSecretServing {
  serving_description?: string;
  metric_serving_amount?: string;
  metric_serving_unit?: string;
  calories?: string;
  protein?: string;
  carbohydrate?: string;
  fat?: string;
  fiber?: string;
  sugar?: string;
}

interface FatSecretFood {
  food_id: string;
  food_name: string;
  brand_name?: string;
  servings?: { serving: FatSecretServing | FatSecretServing[] };
}

function firstServing(food: FatSecretFood): FatSecretServing | undefined {
  const serving = food.servings?.serving;
  if (!serving) return undefined;
  return Array.isArray(serving) ? serving[0] : serving;
}

// FatSecret gives per-serving values; normalize to per-100g using the serving's
// metric gram amount when available.
function mapFood(food: FatSecretFood): NormalizedFood | null {
  const serving = firstServing(food);
  const gramAmount = Number(serving?.metric_serving_amount);
  const kcalPerServing = Number(serving?.calories);

  if (!serving || !gramAmount || Number.isNaN(kcalPerServing)) return null;

  const factor = 100 / gramAmount;
  return {
    source: "fatsecret",
    sourceId: food.food_id,
    name: food.food_name,
    brand: food.brand_name,
    servingSizeG: gramAmount,
    servingLabel: serving.serving_description,
    per100g: {
      kcal: kcalPerServing * factor,
      protein: Number(serving.protein ?? 0) * factor,
      carbs: Number(serving.carbohydrate ?? 0) * factor,
      fat: Number(serving.fat ?? 0) * factor,
      fiber: serving.fiber ? Number(serving.fiber) * factor : undefined,
      sugar: serving.sugar ? Number(serving.sugar) * factor : undefined,
    },
  };
}

async function apiGet(path: string, params: Record<string, string>) {
  const token = await getAccessToken();
  const url = new URL(`${API_BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("format", "json");

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`FatSecret request failed: ${res.status}`);
  return res.json();
}

export const fatSecretAdapter: FoodSource = {
  name: "fatsecret",

  isConfigured() {
    return clientId().length > 0 && clientSecret().length > 0;
  },

  async search(query: string): Promise<NormalizedFood[]> {
    if (!this.isConfigured()) return [];

    const data = (await apiGet("foods/search/v1", { search_expression: query })) as {
      foods?: { food?: FatSecretFood | FatSecretFood[] };
    };
    const foods = data.foods?.food;
    if (!foods) return [];
    const list = Array.isArray(foods) ? foods : [foods];
    return list.map(mapFood).filter((f): f is NormalizedFood => f !== null);
  },

  async getByBarcode(barcode: string): Promise<NormalizedFood | null> {
    if (!this.isConfigured()) return null;

    const idData = (await apiGet("food/barcode/find-by-id/v1", {
      barcode,
    })) as { food_id?: { value?: string } };
    const foodId = idData.food_id?.value;
    if (!foodId || foodId === "0") return null;

    const foodData = (await apiGet("food/v4", { food_id: foodId })) as {
      food?: FatSecretFood;
    };
    return foodData.food ? mapFood(foodData.food) : null;
  },
};
