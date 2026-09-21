import { useState } from "react";
import { api, ApiError } from "../api/client";
import type { Food } from "../types";
import { Sheet } from "./Sheet";

interface ManualFoodSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated: (food: Food) => void;
  initialBarcode?: string;
}

export function ManualFoodSheet({ open, onClose, onCreated, initialBarcode }: ManualFoodSheetProps) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Bitte einen Namen angeben.");
      return;
    }
    setSaving(true);
    try {
      const food = await api.foods.createManual({
        name: name.trim(),
        brand: brand.trim() || undefined,
        barcode: initialBarcode,
        kcalPer100g: Number(kcal) || 0,
        proteinPer100g: Number(protein) || 0,
        carbsPer100g: Number(carbs) || 0,
        fatPer100g: Number(fat) || 0,
      });
      setName("");
      setBrand("");
      setKcal("");
      setProtein("");
      setCarbs("");
      setFat("");
      onCreated(food);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erstellen fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Eigenes Lebensmittel">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {initialBarcode && (
          <p className="-mt-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            Barcode {initialBarcode} wurde nicht gefunden – wird nach dem Speichern diesem Eintrag zugeordnet, damit
            er beim nächsten Scan sofort erkannt wird.
          </p>
        )}
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Marke (optional)</span>
          <input className="input" value={brand} onChange={(e) => setBrand(e.target.value)} />
        </label>

        <p className="text-xs -mb-2" style={{ color: "var(--color-text-secondary)" }}>
          Nährwerte pro 100 g
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">kcal</span>
            <input type="number" inputMode="decimal" className="input" value={kcal} onChange={(e) => setKcal(e.target.value)} required />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Protein (g)</span>
            <input type="number" inputMode="decimal" className="input" value={protein} onChange={(e) => setProtein(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Kohlenhydrate (g)</span>
            <input type="number" inputMode="decimal" className="input" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Fett (g)</span>
            <input type="number" inputMode="decimal" className="input" value={fat} onChange={(e) => setFat(e.target.value)} />
          </label>
        </div>

        {error && (
          <p className="text-sm text-center" style={{ color: "var(--color-danger)" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl py-3.5 font-semibold text-white disabled:opacity-60"
          style={{ background: "var(--color-accent)" }}
        >
          {saving ? "Erstelle…" : "Erstellen & weiter"}
        </button>
      </form>
    </Sheet>
  );
}
