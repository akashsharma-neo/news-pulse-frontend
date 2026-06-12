"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchFeed,
  fetchTodayProgress,
  fetchTracks,
  markClusterRead,
  type DailyProgress,
  type ExamTrack,
  type TopicCluster,
} from "@/lib/api";
import { addReadId, getReadIds } from "@/lib/readState";
import ProgressRing from "./ProgressRing";
import ArticleCard from "./ArticleCard";
import BottomNav from "../nav/BottomNav";
import NexLogo from "../brand/NexLogo";

const TIER_LABELS: Record<string, string> = {
  trial: "Free Trial",
  monthly: "Monthly",
  half_yearly: "6-Month Pass",
  annual: "Annual Pass",
  expired: "Trial Ended",
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function firstName(name?: string, email?: string): string {
  if (name && name.trim()) return name.trim().split(" ")[0];
  if (email) return email.split("@")[0];
  return "there";
}

export default function DashboardFeed() {
  const { user } = useAuth();
  const [clusters, setClusters] = useState<TopicCluster[]>([]);
  const [tracks, setTracks] = useState<ExamTrack[]>([]);
  const [progress, setProgress] = useState<DailyProgress | null>(null);
  // Lazy init from localStorage; this component only renders client-side
  // (AppGate shows a spinner during SSR/auth), so there's no hydration risk.
  const [readIds, setReadIds] = useState<Set<number>>(() => getReadIds());
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"tracks" | "daily">("tracks");
  const [pickedTrack, setPickedTrack] = useState<string | null>(null);

  const userTracks = useMemo(() => {
    const slugs = user?.exam_tracks ?? [];
    const bySlug = new Map(tracks.map((t) => [t.slug, t]));
    return slugs.map((s) => bySlug.get(s)).filter((t): t is ExamTrack => !!t);
  }, [tracks, user]);

  // Default to the user's first track until they pick another (derived, no effect).
  const activeTrack = pickedTrack ?? userTracks[0]?.slug ?? null;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [feed, trackList, prog] = await Promise.all([
          fetchFeed(1, 30),
          fetchTracks().catch(() => [] as ExamTrack[]),
          fetchTodayProgress().catch(() => null),
        ]);
        if (!active) return;
        setClusters(feed.results);
        setTracks(trackList);
        setProgress(prog);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleMarkRead = useCallback(async (id: number) => {
    setReadIds(addReadId(id));
    try {
      const res = await markClusterRead(id);
      setProgress(res.progress);
    } catch {
      // keep optimistic read state; progress will reconcile on next load
    }
  }, []);

  const visible = useMemo(() => {
    if (mode === "daily" || !activeTrack) return clusters;
    return clusters.filter((c) => {
      const targets = c.exam_targets ?? [];
      return targets.length === 0 || targets.includes(activeTrack);
    });
  }, [clusters, mode, activeTrack]);

  const tierLabel = TIER_LABELS[user?.subscription_tier ?? "trial"] ?? "Trial";
  const primaryTrack = userTracks[0]?.name?.split(" ")[0] ?? "";
  const streak = progress?.streak_count ?? user?.streak_count ?? 0;
  const readCount = progress?.articles_read_count ?? 0;
  const total = progress?.total_articles_today ?? visible.length;
  const readPct = total > 0 ? Math.round((100 * readCount) / total) : 0;
  const dateLabel = new Date()
    .toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" })
    .toUpperCase();

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-24 pt-5">
      {/* Header */}
      <header className="mb-4">
        <div className="mb-2 flex items-center gap-2">
          <NexLogo className="h-6 w-6" />
          <span className="font-display text-lg font-bold">NexPrep</span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold">
              {greeting()}, {firstName(user?.name, user?.email)}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="label-caps rounded bg-surface-elevated px-2 py-0.5 text-[10px] text-foreground">
                {tierLabel}
                {primaryTrack ? ` · ${primaryTrack}` : ""}
              </span>
              {streak > 0 && (
                <span className="flex items-center gap-1 text-[12px] text-accent">
                  <span aria-hidden>🔥</span>
                  <span className="font-mono">{streak}-day streak</span>
                </span>
              )}
            </div>
            <p className="mt-1 font-mono text-[11px] text-muted">{dateLabel}</p>
          </div>
          <ProgressRing
            used={progress?.minutes_used ?? 0}
            target={progress?.minutes_target ?? 30}
          />
        </div>

        {/* N/M read bar */}
        <div className="mt-4 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-elevated">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${readPct}%` }}
            />
          </div>
          <span className="font-mono text-[11px] text-muted">
            {readCount}/{total} read
          </span>
        </div>
      </header>

      {/* Segmented toggle */}
      <div className="mb-3 flex rounded-xl bg-surface p-1">
        <button
          type="button"
          onClick={() => setMode("tracks")}
          className={`flex-1 rounded-lg py-1.5 text-[13px] font-medium transition-colors ${
            mode === "tracks" ? "bg-surface-elevated text-foreground" : "text-muted"
          }`}
        >
          Syllabus Tracks
        </button>
        <button
          type="button"
          onClick={() => setMode("daily")}
          className={`flex-1 rounded-lg py-1.5 text-[13px] font-medium transition-colors ${
            mode === "daily" ? "bg-surface-elevated text-foreground" : "text-muted"
          }`}
        >
          {clusters.length} Daily Articles
        </button>
      </div>

      {/* Track chips */}
      {mode === "tracks" && userTracks.length > 0 && (
        <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
          {userTracks.map((t) => (
            <button
              key={t.slug}
              type="button"
              onClick={() => setPickedTrack(t.slug)}
              className={`label-caps shrink-0 rounded-full border px-3 py-1.5 text-[11px] transition-colors ${
                activeTrack === t.slug
                  ? "border-accent text-accent"
                  : "border-border-subtle text-muted hover:text-foreground"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {/* Feed */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <FeedSkeleton />
        ) : visible.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">
            No stories yet for this track. Check back after the next batch.
          </p>
        ) : (
          visible.map((c) => (
            <ArticleCard
              key={c.id}
              cluster={c}
              isRead={readIds.has(c.id)}
              onMarkRead={handleMarkRead}
            />
          ))
        )}
      </div>

      {/* Batch banner */}
      <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-border-subtle bg-surface px-3 py-2.5 text-[12px] text-muted">
        <span aria-hidden>🔔</span>
        Tomorrow&apos;s batch drops at{" "}
        <span className="font-mono text-foreground">6:00 AM</span>
      </div>

      <BottomNav active="feed" />
    </div>
  );
}

function FeedSkeleton() {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-2xl border border-border-subtle bg-surface"
        />
      ))}
    </>
  );
}
