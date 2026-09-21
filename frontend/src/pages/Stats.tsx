import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../api/client";
import { Card } from "../components/Card";
import { useProfile } from "../hooks/useProfile";
import type { DailyStat } from "../types";

const RANGES = [
  { days: 7, label: "7 Tage" },
  { days: 30, label: "30 Tage" },
];

export function Stats() {
  const { profile } = useProfile();
  const [days, setDays] = useState(7);
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.stats
      .daily(days)
      .then(setStats)
      .finally(() => setLoading(false));
  }, [days]);

  const chartData = stats.map((s) => ({
    ...s,
    label: new Date(s.date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
    kcal: Math.round(s.kcal),
  }));

  const avg = stats.length ? Math.round(stats.reduce((sum, s) => sum + s.kcal, 0) / stats.length) : 0;
  const daysOnTarget = profile
    ? stats.filter((s) => s.kcal > 0 && s.kcal <= profile.dailyCalorieGoal).length
    : 0;

  return (
    <div className="pt-safe px-5 pb-6">
      <header className="pt-6 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Statistik</h1>
        <div className="flex rounded-xl p-1" style={{ background: "var(--color-surface-alt)" }}>
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
              style={{
                background: days === r.days ? "var(--color-surface)" : "transparent",
                color: days === r.days ? "var(--color-text)" : "var(--color-text-secondary)",
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      <Card className="p-4">
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-text-secondary)" }}>
          Kalorien pro Tag
        </h2>
        {loading ? (
          <div className="h-56 rounded-xl animate-pulse" style={{ background: "var(--color-surface-alt)" }} />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
                axisLine={false}
                tickLine={false}
                interval={days > 7 ? 4 : 0}
              />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "var(--color-surface-alt)" }}
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 13,
                }}
                formatter={(value) => [`${value} kcal`, "Kalorien"]}
              />
              <Bar dataKey="kcal" fill="var(--color-accent)" radius={[6, 6, 0, 0]} maxBarSize={days > 7 ? 10 : 28} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold tabular-nums">{avg}</p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
            Ø kcal/Tag
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold tabular-nums">{daysOnTarget}</p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
            Tage im Ziel
          </p>
        </Card>
      </div>
    </div>
  );
}
