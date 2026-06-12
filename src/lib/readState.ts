/**
 * Client-side cache of "read today" cluster IDs.
 *
 * The backend tracks read state authoritatively (and drives the progress
 * ring/bar), but the feed/detail serializers don't carry per-user read flags.
 * To keep card checkmarks consistent within a day without a new endpoint, we
 * mirror reads in localStorage keyed by the local date; it resets each day.
 */
function todayKey(): string {
  const d = new Date();
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
  return `nexprep_read_${iso}`;
}

export function getReadIds(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(todayKey());
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

export function addReadId(id: number): Set<number> {
  const ids = getReadIds();
  ids.add(id);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(todayKey(), JSON.stringify([...ids]));
    } catch {
      // ignore quota/serialization errors — non-critical UI state
    }
  }
  return ids;
}
