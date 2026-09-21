import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Card } from "../components/Card";
import { addDays, formatDayLabel, todayString } from "../lib/date";
import type { DiaryDay, HistoryDay, MealType } from "../types";

const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: "Frühstück",
  LUNCH: "Mittagessen",
  DINNER: "Abendessen",
  SNACK: "Snacks",
};

export function Diary() {
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [day, setDay] = useState<DiaryDay | null>(null);
  const [history, setHistory] = useState<HistoryDay[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDay = useCallback((date: string) => {
    setLoading(true);
    api.diary
      .get(date)
      .then(setDay)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadDay(selectedDate);
  }, [selectedDate, loadDay]);

  useEffect(() => {
    api.diary.history(30).then(setHistory);
  }, [day]);

  async function handleDelete(id: string) {
    await api.diary.remove(id);
    loadDay(selectedDate);
  }

  return (
    <div className="pt-safe px-5 pb-6">
      <header className="pt-6 pb-4">
        <h1 className="text-2xl font-bold">Tagebuch</h1>
      </header>

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setSelectedDate((d) => addDays(d, -1))}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "var(--color-surface-alt)" }}
          aria-label="Vorheriger Tag"
        >
          ‹
        </button>
        <span className="font-semibold">{formatDayLabel(selectedDate)}</span>
        <button
          onClick={() => setSelectedDate((d) => addDays(d, 1))}
          disabled={selectedDate >= todayString()}
          className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-30"
          style={{ background: "var(--color-surface-alt)" }}
          aria-label="Nächster Tag"
        >
          ›
        </button>
      </div>

      {!loading && day && (
        <Card className="p-4 mb-4 flex items-center justify-around text-center">
          <Stat label="kcal" value={Math.round(day.totals.kcal)} />
          <Stat label="Protein" value={`${Math.round(day.totals.protein)}g`} />
          <Stat label="Kohlenh." value={`${Math.round(day.totals.carbs)}g`} />
          <Stat label="Fett" value={`${Math.round(day.totals.fat)}g`} />
        </Card>
      )}

      {loading ? (
        <SkeletonList />
      ) : day && day.entries.length > 0 ? (
        <Card className="mb-6 divide-y" style={{ borderColor: "var(--color-border)" }}>
          {day.entries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{entry.food.name}</p>
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  {MEAL_LABELS[entry.mealType]} · {entry.unitLabel} · {Math.round(entry.kcal)} kcal
                </p>
              </div>
              <button
                onClick={() => handleDelete(entry.id)}
                className="text-xs font-medium flex-shrink-0"
                style={{ color: "var(--color-danger)" }}
              >
                Löschen
              </button>
            </div>
          ))}
        </Card>
      ) : (
        <Card className="p-6 text-center mb-6">
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Keine Einträge an diesem Tag.
          </p>
          {selectedDate === todayString() && (
            <Link
              to="/add"
              className="inline-block mt-3 rounded-xl px-4 py-2 text-sm font-semibold text-white"
              style={{ background: "var(--color-accent)" }}
            >
              Essen hinzufügen
            </Link>
          )}
        </Card>
      )}

      <h2 className="text-lg font-semibold mb-2">Verlauf</h2>
      <Card className="divide-y" style={{ borderColor: "var(--color-border)" }}>
        {history.length === 0 && (
          <p className="px-4 py-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Noch keine vergangenen Tage.
          </p>
        )}
        {history.map((h) => (
          <button
            key={h.date}
            onClick={() => setSelectedDate(h.date)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
            style={{ background: h.date === selectedDate ? "var(--color-accent-soft)" : "transparent" }}
          >
            <span className="text-sm font-medium">{formatDayLabel(h.date)}</span>
            <span className="text-sm tabular-nums" style={{ color: "var(--color-text-secondary)" }}>
              {Math.round(h.totals.kcal)} kcal
            </span>
          </button>
        ))}
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-base font-semibold tabular-nums">{value}</p>
      <p className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </p>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="mb-6 flex flex-col gap-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ background: "var(--color-surface-alt)" }} />
      ))}
    </div>
  );
}
