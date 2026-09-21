export type FoodSourceName = "openfoodfacts" | "usda" | "fatsecret" | "manual";

export interface MacrosPer100g {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
}

// The single internal shape every adapter must map its API's response onto.
export interface NormalizedFood {
  source: FoodSourceName;
  sourceId: string;
  barcode?: string;
  name: string;
  brand?: string;
  servingSizeG?: number;
  servingLabel?: string;
  per100g: MacrosPer100g;
}

export interface FoodSource {
  name: FoodSourceName;
  isConfigured(): boolean;
  search(query: string): Promise<NormalizedFood[]>;
  getByBarcode(barcode: string): Promise<NormalizedFood | null>;
}
