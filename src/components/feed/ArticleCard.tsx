"use client";

import Link from "next/link";
import type { TopicCluster } from "@/lib/api";
import { gsColor, gsLabel } from "@/lib/gsTag";

/**
 * Feed article card (PRD §UI). Shows the GS taxonomy pill, an optional
 * high-yield badge, read time, a 2-line exam-topic title, and the read state.
 */
export default function ArticleCard({
  cluster,
  isRead,
  onMarkRead,
}: {
  cluster: TopicCluster;
  isRead: boolean;
  onMarkRead: (id: number) => void;
}) {
  const label = gsLabel(cluster.gs_paper_tag, cluster.category_slug);
  const color = gsColor(cluster.gs_paper_tag);
  // Heuristic high-yield flag until an explicit field exists: an enriched
  // story with a Prelims/Mains exam angle is the examiner-relevant signal.
  const highYield = (cluster.exam_angle?.length ?? 0) > 0;
  const minutes = cluster.reading_minutes || 1;

  return (
    <Link
      href={`/article/${cluster.id}`}
      className="block rounded-2xl border border-border-subtle bg-surface p-4 transition-colors hover:border-white/15"
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className="label-caps rounded px-1.5 py-0.5 text-[10px]"
          style={{
            color,
            backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
          }}
        >
          {label}
        </span>
        {highYield && (
          <span className="label-caps rounded bg-accent/15 px-1.5 py-0.5 text-[10px] text-accent">
            High Yield
          </span>
        )}
        <span className="ml-auto flex items-center gap-1 font-mono text-[11px] text-muted">
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          {minutes} Min
        </span>
      </div>

      <div className="flex items-start gap-3">
        <h3
          className={`font-display text-[15px] font-medium leading-snug ${
            isRead ? "text-muted line-through" : "text-foreground"
          }`}
        >
          {cluster.primary_title}
        </h3>
        {isRead ? (
          <span
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-success"
            aria-label="Read"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
              <path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onMarkRead(cluster.id);
            }}
            aria-label="Mark as read"
            className="mt-0.5 shrink-0 text-muted transition-colors hover:text-success"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
    </Link>
  );
}
