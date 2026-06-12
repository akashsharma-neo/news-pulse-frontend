"use client";

import type { ExamTrack } from "@/lib/api";

export default function ExamTrackPicker({
  tracks,
  selected,
  onToggle,
}: {
  tracks: ExamTrack[];
  selected: Set<string>;
  onToggle: (slug: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {tracks.map((t) => {
        const active = selected.has(t.slug);
        return (
          <button
            key={t.slug}
            type="button"
            onClick={() => onToggle(t.slug)}
            aria-pressed={active}
            className={`rounded-2xl border p-4 text-left transition-colors ${
              active
                ? "border-accent bg-surface-elevated"
                : "border-border-subtle bg-surface hover:border-white/15"
            }`}
          >
            <span
              className="mb-3 block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: t.color }}
            />
            <span className="block font-display text-[15px] font-semibold">{t.name}</span>
            <span className="mt-1 block text-[11px] leading-snug text-muted">{t.subtitle}</span>
          </button>
        );
      })}
    </div>
  );
}
