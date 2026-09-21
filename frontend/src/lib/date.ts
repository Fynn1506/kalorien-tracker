// Local calendar-day helpers. We always work with "YYYY-MM-DD" day strings on
// the wire so the day boundary follows the phone's timezone, not UTC.
export function todayString(): string {
  return toDayString(new Date());
}

export function toDayString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(dayString: string, delta: number): string {
  const [y, m, d] = dayString.split("-").map(Number);
  const date = new Date(y, m - 1, d + delta);
  return toDayString(date);
}

export function formatDayLabel(dayString: string, locale = "de-DE"): string {
  const today = todayString();
  const yesterday = addDays(today, -1);
  if (dayString === today) return "Heute";
  if (dayString === yesterday) return "Gestern";

  const [y, m, d] = dayString.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(locale, { weekday: "short", day: "2-digit", month: "2-digit" });
}
