/** Local calendar date as YYYY-MM-DD. */
export function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** The last `n` local dates, oldest first, ending with `from`. */
export function lastDays(n: number, from = new Date()) {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(from);
    x.setDate(from.getDate() - i);
    out.push(dateKey(x));
  }
  return out;
}

/** Greeting for the place's local time ("2026-11-16T14:00"): morning before 12, afternoon before 17. */
export function greeting(localIso?: string) {
  if (!localIso) return "Hello";
  const h = Number(localIso.slice(11, 13));
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
