import type { Food } from "../types";

interface FoodResultRowProps {
  food: Food;
  isFavorite: boolean;
  onSelect: (food: Food) => void;
  onToggleFavorite: (food: Food) => void;
}

export function FoodResultRow({ food, isFavorite, onSelect, onToggleFavorite }: FoodResultRowProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <button onClick={() => onSelect(food)} className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium truncate">{food.name}</p>
        <p className="text-xs truncate" style={{ color: "var(--color-text-secondary)" }}>
          {food.brand ? `${food.brand} · ` : ""}
          {Math.round(food.kcalPer100g)} kcal / 100g
        </p>
      </button>
      <button
        onClick={() => onToggleFavorite(food)}
        aria-label={isFavorite ? "Favorit entfernen" : "Als Favorit merken"}
        className="flex-shrink-0 w-9 h-9 flex items-center justify-center"
      >
        <StarIcon filled={isFavorite} />
      </button>
    </div>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill={filled ? "var(--color-carbs)" : "none"}>
      <path
        d="m12 3 2.6 5.6 6 .7-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6-4.4-4.2 6-.7L12 3Z"
        stroke={filled ? "var(--color-carbs)" : "var(--color-text-secondary)"}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
