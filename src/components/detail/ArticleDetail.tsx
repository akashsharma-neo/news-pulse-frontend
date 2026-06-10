"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchCluster,
  markClusterRead,
  toggleBookmark,
  type TopicCluster,
} from "@/lib/api";
import { addReadId } from "@/lib/readState";
import { gsColor, gsLabel } from "@/lib/gsTag";
import { useAuth } from "@/contexts/AuthContext";
import AIGuidePanel from "../ai/AIGuidePanel";
import BottomNav from "../nav/BottomNav";
import FullScreenSpinner from "../FullScreenSpinner";

export default function ArticleDetail({ id }: { id: number }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [cluster, setCluster] = useState<TopicCluster | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const c = await fetchCluster(id);
        if (!active) return;
        setCluster(c);
        // Opening the brief counts as reading it (PRD progress).
        if (isAuthenticated) {
          markClusterRead(id).catch(() => undefined);
          addReadId(id);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, isAuthenticated]);

  async function onBookmark() {
    setBookmarked((b) => !b); // optimistic
    try {
      const state = await toggleBookmark(id);
      setBookmarked(state);
    } catch {
      setBookmarked((b) => !b); // revert
    }
  }

  async function onShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      await navigator.share({ title: cluster?.primary_title, url }).catch(() => undefined);
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url).catch(() => undefined);
    }
  }

  if (loading) return <FullScreenSpinner />;
  if (!cluster) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-muted">This story couldn&apos;t be loaded.</p>
        <button onClick={() => router.push("/")} className="mt-4 text-[13px] text-accent">
          Back to feed
        </button>
      </div>
    );
  }

  const label = gsLabel(cluster.gs_paper_tag, cluster.category_slug);
  const color = gsColor(cluster.gs_paper_tag);
  const minutes = cluster.reading_minutes || 1;
  const facts = cluster.key_facts ?? [];
  const angle = cluster.exam_angle ?? [];
  const anchors = cluster.static_anchors ?? [];
  const pyqs = cluster.pyqs ?? [];

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pb-28 pt-4">
      {/* Top bar */}
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => router.back()}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-foreground"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span
          className="label-caps rounded px-2 py-1 text-[10px]"
          style={{ color, backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` }}
        >
          {label}
        </span>
        <span className="flex items-center gap-1 font-mono text-[11px] text-muted">
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          {minutes} Min Read
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onBookmark}
            aria-label="Bookmark"
            aria-pressed={bookmarked}
            className={`flex h-9 w-9 items-center justify-center rounded-full bg-surface ${
              bookmarked ? "text-accent" : "text-muted"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill={bookmarked ? "currentColor" : "none"}>
              <path d="M6 4h12v16l-6-4-6 4V4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={onShare}
            aria-label="Share"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-muted"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <circle cx="6" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="18" cy="6" r="2.4" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="18" cy="18" r="2.4" stroke="currentColor" strokeWidth="1.6" />
              <path d="M8 11l8-4M8 13l8 4" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Title */}
      <h1 className="font-display text-2xl font-bold leading-tight">
        {cluster.primary_title}
      </h1>

      {/* Why in News */}
      {cluster.why_in_news ? (
        <section className="mt-5 rounded-2xl border border-accent/30 bg-accent/[0.06] p-4">
          <h2 className="label-caps mb-2 text-[10px] text-accent">Why in News</h2>
          <p className="text-[15px] leading-relaxed text-foreground">{cluster.why_in_news}</p>
        </section>
      ) : (
        cluster.summary && (
          <p className="mt-4 text-[15px] leading-relaxed text-foreground">{cluster.summary}</p>
        )
      )}

      {/* High-yield facts */}
      {facts.length > 0 && (
        <section className="mt-6">
          <h2 className="label-caps mb-3 text-[10px] text-muted">High-Yield Facts</h2>
          <ul className="space-y-3">
            {facts.map((fact, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 font-mono text-[11px] text-accent">
                  {i + 1}
                </span>
                <span className="text-[15px] leading-relaxed text-foreground">{fact}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Exam angle — signature indigo glow */}
      {angle.length > 0 && (
        <section
          className="mt-6 rounded-2xl border border-accent-ai/40 bg-accent-ai/[0.06] p-4"
          style={{ boxShadow: "inset 3px 0 0 var(--accent-ai)" }}
        >
          <h2 className="label-caps mb-3 flex items-center gap-1.5 text-[10px] text-accent-ai">
            <span aria-hidden>◎</span> Exam Angle
          </h2>
          <div className="space-y-3">
            {angle.map((row, i) => (
              <div key={i} className="flex flex-col gap-1 sm:flex-row sm:gap-3">
                <span className="label-caps w-fit shrink-0 rounded bg-accent-ai/20 px-1.5 py-0.5 text-[10px] text-accent-ai">
                  {row.label}
                </span>
                <span className="text-[14px] leading-relaxed text-foreground">{row.text}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Static anchor points */}
      {anchors.length > 0 && (
        <section className="mt-4 rounded-2xl border border-border-subtle bg-surface p-4">
          <h2 className="label-caps mb-3 text-[10px] text-accent-ai">Static Anchor Points</h2>
          <ul className="space-y-2.5">
            {anchors.map((a, i) => (
              <li key={i} className="flex gap-2 text-[14px] leading-relaxed text-foreground">
                <span className="text-muted" aria-hidden>›</span>
                {a}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Trend context */}
      {cluster.trend_context && (
        <section className="mt-4 rounded-2xl border border-border-subtle bg-surface p-4">
          <h2 className="label-caps mb-2 flex items-center gap-1.5 text-[10px] text-success">
            <span aria-hidden>📈</span> Trend Context
          </h2>
          <p className="text-[14px] leading-relaxed text-muted">{cluster.trend_context}</p>
        </section>
      )}

      {/* Related PYQs */}
      {pyqs.length > 0 && (
        <section className="mt-4">
          <h2 className="label-caps mb-3 text-[10px] text-muted">Related PYQs</h2>
          <ul className="space-y-3">
            {pyqs.map((q, i) => (
              <li key={i} className="rounded-2xl border border-border-subtle bg-surface p-4">
                <p className="label-caps mb-1.5 text-[10px] text-accent">
                  {q.year} · {q.exam}
                </p>
                <p className="text-[14px] leading-relaxed text-foreground">{q.question}</p>
                {q.answer && (
                  <p className="mt-2 text-[13px] leading-relaxed text-muted">
                    <span className="text-success">Ans:</span> {q.answer}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Ask AI Guide FAB — anchored to the centered column's right edge */}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-30">
        <div className="mx-auto flex max-w-md justify-end px-4">
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-accent-ai px-5 py-3 font-display text-[14px] font-semibold text-white shadow-lg shadow-accent-ai/30"
          >
            <span aria-hidden>✦</span> Ask AI Guide
          </button>
        </div>
      </div>

      {guideOpen && <AIGuidePanel cluster={cluster} onClose={() => setGuideOpen(false)} />}

      <BottomNav active="feed" />
    </div>
  );
}
