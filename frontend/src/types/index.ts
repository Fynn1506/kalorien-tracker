export type Sex = "MALE" | "FEMALE";
export type ActivityLevel = "SEDENTARY" | "LIGHT" | "MODERATE" | "ACTIVE" | "VERY_ACTIVE";
export type Goal = "LOSE" | "MAINTAIN" | "GAIN";
export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

export interface Profile {
  id: number;
  age: number;
  sex: Sex;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  dailyCalorieGoal: number;
  proteinGoalG: number;
  carbsGoalG: number;
  fatGoalG: number;
}

export interface Food {
  id: string;
  source: string;
  sourceId: string;
  barcode: string | null;
  name: string;
  brand: string | null;
  servingSizeG: number | null;
  servingLabel: string | null;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number | null;
  sugarPer100g: number | null;
}

export interface DiaryEntry {
  id: string;
  date: string;
  mealType: MealType;
  quantityG: number;
  unitLabel: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  sugar: number | null;
  foodId: string;
  food: Food;
}

export interface Totals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DiaryDay {
  date: string;
  entries: DiaryEntry[];
  totals: Totals;
}

export interface HistoryDay {
  date: string;
  totals: Totals;
  entryCount: number;
}

export interface DailyStat extends Totals {
  date: string;
}

export interface SourceError {
  source: string;
  message: string;
}

export interface SearchResult {
  foods: Food[];
  errors: SourceError[];
}
