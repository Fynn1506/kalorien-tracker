import { useState } from "react";
import { api, ApiError } from "../api/client";
import { useProfile } from "../hooks/useProfile";
import type { ActivityLevel, Goal, Sex } from "../types";

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; hint: string }[] = [
  { value: "SEDENTARY", label: "Kaum aktiv", hint: "Bürojob, wenig Bewegung" },
  { value: "LIGHT", label: "Leicht aktiv", hint: "1–3× Sport/Woche" },
  { value: "MODERATE", label: "Mäßig aktiv", hint: "3–5× Sport/Woche" },
  { value: "ACTIVE", label: "Sehr aktiv", hint: "6–7× Sport/Woche" },
  { value: "VERY_ACTIVE", label: "Extrem aktiv", hint: "Täglich, körperliche Arbeit" },
];

const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: "LOSE", label: "Abnehmen" },
  { value: "MAINTAIN", label: "Gewicht halten" },
  { value: "GAIN", label: "Zunehmen" },
];

export function Onboarding() {
  const { refresh } = useProfile();
  const [age, setAge] = useState("30");
  const [sex, setSex] = useState<Sex>("FEMALE");
  const [weightKg, setWeightKg] = useState("65");
  const [heightCm, setHeightCm] = useState("170");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("MODERATE");
  const [goal, setGoal] = useState<Goal>("MAINTAIN");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.profile.save({
        age: Number(age),
        sex,
        weightKg: Number(weightKg),
        heightCm: Number(heightCm),
        activityLevel,
        goal,
      });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Etwas ist schiefgelaufen.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh pt-safe pb-10 px-5 flex flex-col" style={{ background: "var(--color-bg)" }}>
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col">
        <div className="pt-8 pb-6 text-center">
          <div
            className="w-16 h-16 mx-auto rounded-2xl mb-4 flex items-center justify-center text-3xl"
            style={{ background: "var(--color-accent-soft)" }}
          >
            🎯
          </div>
          <h1 className="text-2xl font-bold">Willkommen</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Ein paar Angaben, damit wir dein Kalorienziel berechnen können.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Alter">
              <input
                type="number"
                required
                min={10}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Geschlecht">
              <select value={sex} onChange={(e) => setSex(e.target.value as Sex)} className="input">
                <option value="FEMALE">Weiblich</option>
                <option value="MALE">Männlich</option>
              </select>
            </Field>
            <Field label="Gewicht (kg)">
              <input
                type="number"
                required
                min={20}
                max={400}
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Größe (cm)">
              <input
                type="number"
                required
                min={100}
                max={250}
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="input"
              />
            </Field>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Aktivitätslevel</p>
            <div className="flex flex-col gap-2">
              {ACTIVITY_OPTIONS.map((opt) => (
                <OptionRow
                  key={opt.value}
                  selected={activityLevel === opt.value}
                  onClick={() => setActivityLevel(opt.value)}
                  label={opt.label}
                  hint={opt.hint}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Ziel</p>
            <div className="grid grid-cols-3 gap-2">
              {GOAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGoal(opt.value)}
                  className="rounded-xl py-3 text-sm font-medium transition-colors"
                  style={{
                    background: goal === opt.value ? "var(--color-accent)" : "var(--color-surface-alt)",
                    color: goal === opt.value ? "white" : "var(--color-text)",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-center" style={{ color: "var(--color-danger)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-xl py-3.5 font-semibold text-white disabled:opacity-60 active:scale-[0.98] transition-transform"
            style={{ background: "var(--color-accent)" }}
          >
            {submitting ? "Berechne…" : "Ziel berechnen"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

function OptionRow({
  selected,
  onClick,
  label,
  hint,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between rounded-xl px-4 py-3 text-left transition-colors"
      style={{
        background: selected ? "var(--color-accent-soft)" : "var(--color-surface-alt)",
        border: selected ? "1.5px solid var(--color-accent)" : "1.5px solid transparent",
      }}
    >
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs" style={{ color: "var(--color-text-secondary)" }}>
          {hint}
        </span>
      </span>
      <span
        className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
        style={{
          border: `2px solid ${selected ? "var(--color-accent)" : "var(--color-border)"}`,
          background: selected ? "var(--color-accent)" : "transparent",
        }}
      >
        {selected && <span className="w-2 h-2 rounded-full bg-white" />}
      </span>
    </button>
  );
}
