import type {
  DailyStat,
  DiaryDay,
  DiaryEntry,
  Food,
  HistoryDay,
  MealType,
  Profile,
  SearchResult,
} from "../types";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// In local dev this stays empty and Vite's proxy forwards /api to the backend.
// For a static deploy (e.g. GitHub Pages) there is no proxy, so the built-time
// VITE_API_BASE_URL must point straight at the deployed backend origin.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    throw new ApiError(
      "Keine Verbindung zum Server. Bitte prüfe deine Internetverbindung.",
      0,
    );
  }

  if (!res.ok) {
    let message = `Fehler ${res.status}`;
    try {
      const body = await res.json();
      message = body.error?.formErrors?.join(", ") || body.error || message;
    } catch {
      // ignore parse failure, use default message
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  profile: {
    get: () => request<Profile | null>("/profile"),
    save: (input: Omit<Profile, "id" | "dailyCalorieGoal" | "proteinGoalG" | "carbsGoalG" | "fatGoalG">) =>
      request<Profile>("/profile", { method: "POST", body: JSON.stringify(input) }),
  },

  foods: {
    search: (query: string) => request<SearchResult>(`/foods/search?q=${encodeURIComponent(query)}`),
    byBarcode: (barcode: string) =>
      request<{ food: Food; errors: unknown[] }>(`/foods/barcode/${encodeURIComponent(barcode)}`),
    favorites: () => request<Food[]>("/foods/favorites"),
    recent: () => request<Food[]>("/foods/recent"),
    addFavorite: (foodId: string) => request(`/foods/favorites/${foodId}`, { method: "POST" }),
    removeFavorite: (foodId: string) => request(`/foods/favorites/${foodId}`, { method: "DELETE" }),
    createManual: (input: {
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
    }) => request<Food>("/foods", { method: "POST", body: JSON.stringify(input) }),
  },

  diary: {
    get: (date: string) => request<DiaryDay>(`/diary?date=${date}`),
    history: (days = 30) => request<HistoryDay[]>(`/diary/history?days=${days}`),
    create: (input: { foodId: string; date: string; mealType: MealType; quantityG: number; unitLabel: string }) =>
      request<DiaryEntry>("/diary", { method: "POST", body: JSON.stringify(input) }),
    update: (id: string, input: Partial<{ quantityG: number; unitLabel: string; mealType: MealType }>) =>
      request<DiaryEntry>(`/diary/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    remove: (id: string) => request<void>(`/diary/${id}`, { method: "DELETE" }),
  },

  stats: {
    daily: (days = 7) => request<DailyStat[]>(`/stats/daily?days=${days}`),
  },
};
