import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api/client";
import { Card } from "../components/Card";
import { MacroBar } from "../components/MacroBar";
import { ProgressRing } from "../components/ProgressRing";
import { todayString } from "../lib/date";
import { useProfile } from "../hooks/useProfile";
import type { DiaryDay, MealType } from "../types";

const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: "Frühstück",
  LUNCH: "Mittagessen",
  DINNER: "Abendessen",
  SNACK: "Snacks",
};

const MEAL_ORDER: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

export function Dashboard() {
  const { profile } = useProfile();
  const [day, setDay] = useState<DiaryDay | null>(null);
  const [error, setError] = useState<string | null>(null);
  const today = todayString();

  const load = useCallback(() => {
    api.diary
      .get(today)
      .then(setDay)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Laden fehlgeschlagen."));
  }, [today]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string) {
    setDay((prev) => (prev ? { ...prev, entries: prev.entries.filter((e) => e.id !== id) } : prev));
    try {
      await api.diary.remove(id);
      load();
    } catch {
      load();
    }
  }

  if (!profile) return null;

  const consumed = day?.totals.kcal ?? 0;
  const remaining = Math.round(profile.dailyCalorieGoal - consumed);
  const progress = consumed / profile.dailyCalorieGoal;

  const entriesByMeal = MEAL_ORDER.map((meal) => ({
    meal,
    entries: day?.entries.filter((e) => e.mealType === meal) ?? [],
  })).filter((g) => g.entries.length > 0);

  return (
    <div className="pt-safe px-5 pb-6">
      <header className="pt-6 pb-2">
        <h1 className="text-2xl font-bold">Heute</h1>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {new Date().toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" })}
        </p>
      </header>

      {error && (
        <Card className="p-4 mt-4 text-sm" style={{ color: "var(--color-danger)" }}>
          {error}
        </Card>
      )}

      <Card className="mt-4 p-6 flex flex-col items-center">
        <ProgressRing progress={progress} size={200} strokeWidth={16}>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold tabular-nums">{Math.abs(remaining)}</span>
            <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {remaining >= 0 ? "kcal übrig" : "kcal über Ziel"}
            </span>
          </div>
        </ProgressRing>

        <div className="grid grid-cols-3 gap-4 w-full mt-6 text-center">
          <Stat label="Ziel" value={profile.dailyCalorieGoal} />
          <Stat label="Gegessen" value={Math.round(consumed)} />
          <Stat label="Verbleibend" value={Math.max(remaining, 0)} />
        </div>
      </Card>

      <Card className="mt-4 p-5 flex flex-col gap-4">
        <MacroBar
          label="Protein"
          consumed={day?.totals.protein ?? 0}
          goal={profile.proteinGoalG}
          color="var(--color-protein)"
        />
        <MacroBar
          label="Kohlenhydrate"
          consumed={day?.totals.carbs ?? 0}
          goal={profile.carbsGoalG}
          color="var(--color-carbs)"
        />
        <MacroBar label="Fett" consumed={day?.totals.fat ?? 0} goal={profile.fatGoalG} color="var(--color-fat)" />
      </Card>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Mahlzeiten</h2>
        <Link to="/add" className="text-sm font-medium" style={{ color: "var(--color-accent)" }}>
          + Hinzufügen
        </Link>
      </div>

      {entriesByMeal.length === 0 ? (
        <Card className="mt-3 p-6 text-center">
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Noch nichts gegessen heute.
          </p>
          <Link
            to="/add"
            className="inline-block mt-3 rounded-xl px-4 py-2 text-sm font-semibold text-white"
            style={{ background: "var(--color-accent)" }}
          >
            Essen hinzufügen
          </Link>
        </Card>
      ) : (
        <div className="mt-3 flex flex-col gap-4">
          {entriesByMeal.map(({ meal, entries }) => (
            <div key={meal}>
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-1.5 px-1" style={{ color: "var(--color-text-secondary)" }}>
                {MEAL_LABELS[meal]}
              </h3>
              <Card className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                {entries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{entry.food.name}</p>
                      <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        {entry.unitLabel} · {Math.round(entry.kcal)} kcal
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      aria-label="Eintrag löschen"
                      className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </p>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
      <path
        d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 .8 12.1A2 2 0 0 0 9.8 21h4.4a2 2 0 0 0 2-1.9L17 7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
