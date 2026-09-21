import { useMemo, useState } from "react";
import { api, ApiError } from "../api/client";
import { todayString } from "../lib/date";
import type { Food, MealType } from "../types";
import { Sheet } from "./Sheet";

const MEAL_OPTIONS: { value: MealType; label: string }[] = [
  { value: "BREAKFAST", label: "Frühstück" },
  { value: "LUNCH", label: "Mittagessen" },
  { value: "DINNER", label: "Abendessen" },
  { value: "SNACK", label: "Snack" },
];

interface AddFoodSheetProps {
  food: Food | null;
  defaultMealType?: MealType;
  defaultDate?: string;
  onClose: () => void;
  onAdded: () => void;
}

type Unit = "g" | "portion";

export function AddFoodSheet({ food, defaultMealType, defaultDate, onClose, onAdded }: AddFoodSheetProps) {
  const [unit, setUnit] = useState<Unit>("g");
  const [amount, setAmount] = useState("100");
  const [mealType, setMealType] = useState<MealType>(defaultMealType ?? "BREAKFAST");
  const [date] = useState(defaultDate ?? todayString());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quantityG = useMemo(() => {
    const n = Number(amount) || 0;
    if (unit === "portion" && food?.servingSizeG) return n * food.servingSizeG;
    return n;
  }, [amount, unit, food]);

  const preview = useMemo(() => {
    if (!food) return null;
    const factor = quantityG / 100;
    return {
      kcal: food.kcalPer100g * factor,
      protein: food.proteinPer100g * factor,
      carbs: food.carbsPer100g * factor,
      fat: food.fatPer100g * factor,
    };
  }, [food, quantityG]);

  async function handleSubmit() {
    if (!food || quantityG <= 0) return;
    setSaving(true);
    setError(null);
    try {
      const unitLabel =
        unit === "portion"
          ? `${amount} Portion${Number(amount) === 1 ? "" : "en"} (${Math.round(quantityG)} g)`
          : `${Math.round(quantityG)} g`;
      await api.diary.create({ foodId: food.id, date, mealType, quantityG, unitLabel });
      onAdded();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Hinzufügen fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={!!food} onClose={onClose} title={food?.name}>
      {food && (
        <div className="flex flex-col gap-5">
          {food.brand && (
            <p className="-mt-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {food.brand}
            </p>
          )}

          <div className="flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input flex-1"
            />
            <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
              <button
                type="button"
                onClick={() => setUnit("g")}
                className="px-4 text-sm font-medium"
                style={{
                  background: unit === "g" ? "var(--color-accent)" : "transparent",
                  color: unit === "g" ? "white" : "var(--color-text)",
                }}
              >
                Gramm
              </button>
              {food.servingSizeG && (
                <button
                  type="button"
                  onClick={() => setUnit("portion")}
                  className="px-4 text-sm font-medium"
                  style={{
                    background: unit === "portion" ? "var(--color-accent)" : "transparent",
                    color: unit === "portion" ? "white" : "var(--color-text)",
                  }}
                >
                  Portion
                </button>
              )}
            </div>
          </div>
          {unit === "portion" && food.servingSizeG && (
            <p className="-mt-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>
              1 Portion = {food.servingLabel || `${food.servingSizeG} g`}
            </p>
          )}

          <div>
            <p className="text-sm font-medium mb-2">Mahlzeit</p>
            <div className="grid grid-cols-4 gap-2">
              {MEAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMealType(opt.value)}
                  className="rounded-lg py-2 text-xs font-medium"
                  style={{
                    background: mealType === opt.value ? "var(--color-accent)" : "var(--color-surface-alt)",
                    color: mealType === opt.value ? "white" : "var(--color-text)",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {preview && (
            <div className="grid grid-cols-4 gap-2 rounded-xl p-3" style={{ background: "var(--color-surface-alt)" }}>
              <PreviewStat label="kcal" value={Math.round(preview.kcal)} />
              <PreviewStat label="Protein" value={`${Math.round(preview.protein)}g`} />
              <PreviewStat label="Kohlenh." value={`${Math.round(preview.carbs)}g`} />
              <PreviewStat label="Fett" value={`${Math.round(preview.fat)}g`} />
            </div>
          )}

          {error && (
            <p className="text-sm text-center" style={{ color: "var(--color-danger)" }}>
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving || quantityG <= 0}
            className="w-full rounded-xl py-3.5 font-semibold text-white disabled:opacity-60 active:scale-[0.98] transition-transform"
            style={{ background: "var(--color-accent)" }}
          >
            {saving ? "Wird hinzugefügt…" : "Hinzufügen"}
          </button>
        </div>
      )}
    </Sheet>
  );
}

function PreviewStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-sm font-semibold tabular-nums">{value}</p>
      <p className="text-[10px]" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </p>
    </div>
  );
}
