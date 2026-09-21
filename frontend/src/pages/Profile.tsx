import { useState } from "react";
import { api, ApiError } from "../api/client";
import { Card } from "../components/Card";
import { useProfile } from "../hooks/useProfile";
import type { ActivityLevel, Goal, Sex } from "../types";

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  SEDENTARY: "Kaum aktiv",
  LIGHT: "Leicht aktiv",
  MODERATE: "Mäßig aktiv",
  ACTIVE: "Sehr aktiv",
  VERY_ACTIVE: "Extrem aktiv",
};

const GOAL_LABELS: Record<Goal, string> = {
  LOSE: "Abnehmen",
  MAINTAIN: "Halten",
  GAIN: "Zunehmen",
};

export function Profile() {
  const { profile, refresh } = useProfile();
  const [editing, setEditing] = useState(false);

  if (!profile) return null;

  return (
    <div className="pt-safe px-5 pb-6">
      <header className="pt-6 pb-4">
        <h1 className="text-2xl font-bold">Profil</h1>
      </header>

      {editing ? (
        <EditForm
          profile={profile}
          onSaved={async () => {
            await refresh();
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          <Card className="p-5">
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Alter" value={`${profile.age} Jahre`} />
              <InfoItem label="Geschlecht" value={profile.sex === "MALE" ? "Männlich" : "Weiblich"} />
              <InfoItem label="Gewicht" value={`${profile.weightKg} kg`} />
              <InfoItem label="Größe" value={`${profile.heightCm} cm`} />
              <InfoItem label="Aktivität" value={ACTIVITY_LABELS[profile.activityLevel]} />
              <InfoItem label="Ziel" value={GOAL_LABELS[profile.goal]} />
            </div>
          </Card>

          <h2 className="text-lg font-semibold mt-6 mb-2">Tagesziele</h2>
          <Card className="p-5 grid grid-cols-2 gap-4">
            <InfoItem label="Kalorien" value={`${profile.dailyCalorieGoal} kcal`} accent />
            <InfoItem label="Protein" value={`${profile.proteinGoalG} g`} />
            <InfoItem label="Kohlenhydrate" value={`${profile.carbsGoalG} g`} />
            <InfoItem label="Fett" value={`${profile.fatGoalG} g`} />
          </Card>

          <button
            onClick={() => setEditing(true)}
            className="w-full mt-6 rounded-xl py-3.5 font-semibold text-white active:scale-[0.98] transition-transform"
            style={{ background: "var(--color-accent)" }}
          >
            Angaben bearbeiten
          </button>
        </>
      )}
    </div>
  );
}

function InfoItem({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </p>
      <p className="text-base font-semibold mt-0.5" style={{ color: accent ? "var(--color-accent)" : undefined }}>
        {value}
      </p>
    </div>
  );
}

function EditForm({
  profile,
  onSaved,
  onCancel,
}: {
  profile: ReturnType<typeof useProfile>["profile"];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const p = profile!;
  const [age, setAge] = useState(String(p.age));
  const [sex, setSex] = useState<Sex>(p.sex);
  const [weightKg, setWeightKg] = useState(String(p.weightKg));
  const [heightCm, setHeightCm] = useState(String(p.heightCm));
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(p.activityLevel);
  const [goal, setGoal] = useState<Goal>(p.goal);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.profile.save({
        age: Number(age),
        sex,
        weightKg: Number(weightKg),
        heightCm: Number(heightCm),
        activityLevel,
        goal,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Card className="p-5 grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Alter</span>
          <input type="number" className="input" value={age} onChange={(e) => setAge(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Geschlecht</span>
          <select className="input" value={sex} onChange={(e) => setSex(e.target.value as Sex)}>
            <option value="FEMALE">Weiblich</option>
            <option value="MALE">Männlich</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Gewicht (kg)</span>
          <input
            type="number"
            step="0.1"
            className="input"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Größe (cm)</span>
          <input type="number" className="input" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm col-span-2">
          <span className="font-medium">Aktivitätslevel</span>
          <select
            className="input"
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
          >
            {Object.entries(ACTIVITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm col-span-2">
          <span className="font-medium">Ziel</span>
          <select className="input" value={goal} onChange={(e) => setGoal(e.target.value as Goal)}>
            {Object.entries(GOAL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </Card>

      {error && (
        <p className="text-sm text-center" style={{ color: "var(--color-danger)" }}>
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl py-3 font-semibold"
          style={{ background: "var(--color-surface-alt)" }}
        >
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-xl py-3 font-semibold text-white disabled:opacity-60"
          style={{ background: "var(--color-accent)" }}
        >
          {saving ? "Speichere…" : "Speichern"}
        </button>
      </div>
    </form>
  );
}
