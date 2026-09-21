import type { FoodSource, NormalizedFood } from "../types/food.js";

// world.openfoodfacts.org still serves single-product lookups (barcode) reliably
// for anonymous requests, but its legacy /cgi/search.pl text search is heavily
// rate-limited for anonymous users (503s in practice). Full-text search instead
// goes through OFF's newer "Search-a-licious" service, which is unauthenticated
// and unaffected by that limit.
const PRODUCT_URL = "https://world.openfoodfacts.org";
const SEARCH_URL = "https://search.openfoodfacts.org";
const USER_AGENT = "KalorienTrackerPWA/1.0 (contact: dev@example.com)";

const FIELDS = [
  "code",
  "product_name",
  "product_name_de",
  "brands",
  "serving_size",
  "serving_quantity",
  "nutriments",
].join(",");

interface OffNutriments {
  "energy-kcal_100g"?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
  fiber_100g?: number;
  sugars_100g?: number;
}

interface OffProduct {
  code?: string;
  product_name?: string;
  product_name_de?: string;
  brands?: string | string[];
  serving_size?: string;
  serving_quantity?: number;
  nutriments?: OffNutriments;
}

function firstBrand(brands: OffProduct["brands"]): string | undefined {
  if (!brands) return undefined;
  const first = Array.isArray(brands) ? brands[0] : brands.split(",")[0];
  return first?.trim() || undefined;
}

function mapProduct(product: OffProduct): NormalizedFood | null {
  const nutriments = product.nutriments;
  const kcal = nutriments?.["energy-kcal_100g"];
  const name = product.product_name_de || product.product_name;

  // Skip entries without the minimum data we need to be useful.
  if (!product.code || !name || kcal === undefined) {
    return null;
  }

  return {
    source: "openfoodfacts",
    sourceId: product.code,
    barcode: product.code,
    name,
    brand: firstBrand(product.brands),
    servingSizeG: product.serving_quantity,
    servingLabel: product.serving_size,
    per100g: {
      kcal,
      protein: nutriments?.proteins_100g ?? 0,
      carbs: nutriments?.carbohydrates_100g ?? 0,
      fat: nutriments?.fat_100g ?? 0,
      fiber: nutriments?.fiber_100g,
      sugar: nutriments?.sugars_100g,
    },
  };
}

export const openFoodFactsAdapter: FoodSource = {
  name: "openfoodfacts",

  isConfigured() {
    return true; // No API key required.
  },

  async search(query: string): Promise<NormalizedFood[]> {
    const url = new URL(`${SEARCH_URL}/search`);
    url.searchParams.set("q", query);
    url.searchParams.set("page_size", "20");
    url.searchParams.set("fields", FIELDS);
    // Without this, search-a-licious matches against English-analyzed fields
    // only, which barely matches German compound words at all (e.g. a search
    // for "Schokoladenkuchen" went from ~3500 hits down to 2). "de,en" keeps
    // matching imported/English-labeled products too.
    url.searchParams.set("langs", "de,en");

    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) {
      throw new Error(`Open Food Facts search failed: ${res.status}`);
    }

    const data = (await res.json()) as { hits?: OffProduct[] };
    return (data.hits ?? [])
      .map(mapProduct)
      .filter((food): food is NormalizedFood => food !== null);
  },

  async getByBarcode(barcode: string): Promise<NormalizedFood | null> {
    const url = new URL(`${PRODUCT_URL}/api/v2/product/${encodeURIComponent(barcode)}.json`);
    url.searchParams.set("fields", FIELDS);

    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) {
      throw new Error(`Open Food Facts lookup failed: ${res.status}`);
    }

    const data = (await res.json()) as { status: number; product?: OffProduct };
    if (data.status !== 1 || !data.product) {
      return null;
    }

    return mapProduct(data.product);
  },
};
