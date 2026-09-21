// All diary entries are anchored to a UTC midnight timestamp representing
// "the day" they belong to, independent of the client's timezone offset.
export function dayStringToDate(dayString: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayString)) {
    throw new Error(`Invalid day string: ${dayString}`);
  }
  return new Date(`${dayString}T00:00:00.000Z`);
}

export function dateToDayString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayDayString(): string {
  return dateToDayString(new Date());
}
