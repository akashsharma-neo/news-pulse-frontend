/**
 * Helpers for the GS-paper taxonomy pill (PRD §UI taxonomy colors).
 * Parses a `gs_paper_tag` like "GS Paper III – Economy" into a short display
 * label ("GS III · Economy") and the paper's accent color.
 */

const PAPER_COLORS: Record<string, string> = {
  I: "var(--gs1)",
  II: "var(--gs2)",
  III: "var(--gs3)",
  IV: "var(--gs4)",
};

export function paperRoman(tag: string | undefined): string | null {
  if (!tag) return null;
  // Order matters: match the longest roman numeral first.
  const match = tag.match(/\b(IV|III|II|I)\b/);
  return match ? match[1] : null;
}

export function gsColor(tag: string | undefined): string {
  const roman = paperRoman(tag);
  return (roman && PAPER_COLORS[roman]) || "var(--muted)";
}

/** "GS Paper III – Economy" → "GS III · Economy". */
export function gsLabel(tag: string | undefined, fallback?: string): string {
  if (!tag) return (fallback || "").replace(/-/g, " ").toUpperCase();
  return tag
    .replace(/paper\s+/i, "")
    .replace(/\s*[–—-]\s*/g, " · ")
    .trim();
}
