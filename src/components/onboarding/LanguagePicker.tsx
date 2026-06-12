"use client";

const LANGUAGES = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
];

export default function LanguagePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {LANGUAGES.map((l) => {
        const active = value === l.code;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => onChange(l.code)}
            aria-pressed={active}
            className={`flex items-center justify-between rounded-2xl border px-4 py-4 transition-colors ${
              active
                ? "border-accent bg-surface-elevated"
                : "border-border-subtle bg-surface hover:border-white/15"
            }`}
          >
            <span>
              <span className="block font-display text-[15px] font-semibold">{l.name}</span>
              <span className="text-[12px] text-muted">{l.native}</span>
            </span>
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                active ? "border-accent" : "border-border-subtle"
              }`}
            >
              {active && <span className="h-2.5 w-2.5 rounded-full bg-accent" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
