"use client";

/**
 * Daily time-budget ring (PRD §UI dashboard). Shows minutes consumed vs the
 * 30-minute target; turns to "Done" once the target is met.
 */
export default function ProgressRing({
  used,
  target,
  size = 72,
}: {
  used: number;
  target: number;
  size?: number;
}) {
  const safeTarget = target > 0 ? target : 30;
  const ratio = Math.min(1, used / safeTarget);
  const done = used >= safeTarget;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - ratio);
  const remainingPct = Math.max(0, Math.round((1 - ratio) * 100));

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${used} of ${safeTarget} minutes done`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 500ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-base leading-none text-foreground">
          {done ? safeTarget : Math.round(used)}
        </span>
        <span className="label-caps text-[8px] text-muted">
          /{safeTarget} min
        </span>
      </div>
      <span
        className={`absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] ${
          done ? "text-success" : "text-muted"
        }`}
      >
        {done ? "✓ Done" : `${remainingPct}% left`}
      </span>
    </div>
  );
}
