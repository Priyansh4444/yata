// Returns yyyy-MM-dd from a Date or string, using local time (not UTC)
export function toLocalDateInputString(
  date: Date | string | undefined,
): string | undefined {
  if (!date) return undefined;
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return undefined;
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}
