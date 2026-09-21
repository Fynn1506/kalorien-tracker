interface MacroBarProps {
  label: string;
  consumed: number;
  goal: number;
  color: string;
  unit?: string;
}

export function MacroBar({ label, consumed, goal, color, unit = "g" }: MacroBarProps) {
  const progress = goal > 0 ? Math.min(consumed / goal, 1) : 0;

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium" style={{ color: "var(--color-text)" }}>
          {label}
        </span>
        <span className="text-xs tabular-nums" style={{ color: "var(--color-text-secondary)" }}>
          {Math.round(consumed)} / {Math.round(goal)} {unit}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-surface-alt)" }}>
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${progress * 100}%`, background: color }}
        />
      </div>
    </div>
  );
}
