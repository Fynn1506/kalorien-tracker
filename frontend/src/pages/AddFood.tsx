import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { AddFoodSheet } from "../components/AddFoodSheet";
import { BarcodeScanner } from "../components/BarcodeScanner";
import { Card } from "../components/Card";
import { FoodResultRow } from "../components/FoodResultRow";
import { ManualFoodSheet } from "../components/ManualFoodSheet";
import type { Food, SourceError } from "../types";

type Tab = "search" | "favorites" | "recent";

export function AddFood() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [sourceErrors, setSourceErrors] = useState<SourceError[]>([]);
  const [searching, setSearching] = useState(false);
  const [favorites, setFavorites] = useState<Food[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [recent, setRecent] = useState<Food[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualBarcode, setManualBarcode] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadFavorites = useCallback(() => {
    api.foods.favorites().then((data) => {
      setFavorites(data);
      setFavoriteIds(new Set(data.map((f) => f.id)));
    });
  }, []);

  useEffect(() => {
    loadFavorites();
    api.foods.recent().then(setRecent);
  }, [loadFavorites]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setSourceErrors([]);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(() => {
      api.foods
        .search(query)
        .then((res) => {
          setResults(res.foods);
          setSourceErrors(res.errors);
        })
        .finally(() => setSearching(false));
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  async function handleToggleFavorite(food: Food) {
    const isFav = favoriteIds.has(food.id);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      isFav ? next.delete(food.id) : next.add(food.id);
      return next;
    });
    await (isFav ? api.foods.removeFavorite(food.id) : api.foods.addFavorite(food.id));
    loadFavorites();
  }

  async function handleBarcodeDetected(code: string) {
    setScanning(false);
    try {
      const { food } = await api.foods.byBarcode(code);
      setSelectedFood(food);
    } catch {
      // Not in any connected source (common for regional/discounter products) —
      // let the user teach the app this product once, keyed by the barcode.
      setManualBarcode(code);
    }
  }

  function handleAdded() {
    setSelectedFood(null);
    navigate("/");
  }

  function closeManualSheet() {
    setManualOpen(false);
    setManualBarcode(null);
  }

  const list = tab === "search" ? results : tab === "favorites" ? favorites : recent;

  return (
    <div className="pt-safe px-5 pb-6">
      <header className="pt-6 pb-4">
        <h1 className="text-2xl font-bold">Essen hinzufügen</h1>
      </header>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <input
            type="search"
            inputMode="search"
            placeholder="Lebensmittel suchen…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setTab("search");
            }}
            className="input pr-9"
          />
        </div>
        <button
          onClick={() => setScanning(true)}
          aria-label="Barcode scannen"
          className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: "var(--color-accent)" }}
        >
          <BarcodeIcon />
        </button>
      </div>

      <div className="flex gap-1.5 mb-3">
        <TabButton active={tab === "search"} onClick={() => setTab("search")} label="Suche" />
        <TabButton active={tab === "favorites"} onClick={() => setTab("favorites")} label="Favoriten" />
        <TabButton active={tab === "recent"} onClick={() => setTab("recent")} label="Zuletzt" />
      </div>

      {tab === "search" && sourceErrors.length > 0 && (
        <p className="text-xs mb-3" style={{ color: "var(--color-text-secondary)" }}>
          Manche Quellen waren nicht erreichbar ({sourceErrors.map((e) => e.source).join(", ")}), es werden
          verfügbare Ergebnisse angezeigt.
        </p>
      )}

      {tab === "search" && searching && <p className="text-sm px-1" style={{ color: "var(--color-text-secondary)" }}>Suche…</p>}

      {tab === "search" && !searching && query.trim() && list.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-sm mb-3" style={{ color: "var(--color-text-secondary)" }}>
            Keine Treffer für „{query}“.
          </p>
          <button
            onClick={() => setManualOpen(true)}
            className="text-sm font-semibold"
            style={{ color: "var(--color-accent)" }}
          >
            Eigenes Lebensmittel erstellen
          </button>
        </Card>
      )}

      {tab !== "search" && list.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {tab === "favorites" ? "Noch keine Favoriten." : "Noch keine kürzlich verwendeten Lebensmittel."}
          </p>
        </Card>
      )}

      {list.length > 0 && (
        <Card className="divide-y" style={{ borderColor: "var(--color-border)" }}>
          {list.map((food) => (
            <FoodResultRow
              key={food.id}
              food={food}
              isFavorite={favoriteIds.has(food.id)}
              onSelect={setSelectedFood}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </Card>
      )}

      <AddFoodSheet food={selectedFood} onClose={() => setSelectedFood(null)} onAdded={handleAdded} />

      <ManualFoodSheet
        open={manualOpen || manualBarcode !== null}
        onClose={closeManualSheet}
        initialBarcode={manualBarcode ?? undefined}
        onCreated={(food) => {
          closeManualSheet();
          setSelectedFood(food);
        }}
      />

      {scanning && <BarcodeScanner onDetected={handleBarcodeDetected} onClose={() => setScanning(false)} />}
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors"
      style={{
        background: active ? "var(--color-accent)" : "var(--color-surface-alt)",
        color: active ? "white" : "var(--color-text)",
      }}
    >
      {label}
    </button>
  );
}

function BarcodeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white">
      <path
        d="M4 5v14M8 5v14M11 5v14M13 5v14M16 5v14M20 5v14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
