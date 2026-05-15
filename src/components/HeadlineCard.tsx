/**
 * HeadlineCard component.
 *
 * InShorts-style card showing a topic cluster as a news headline.
 * Displays title, ~60-word summary, source attribution, and timestamp.
 */

"use client";

import { TopicCluster } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

interface HeadlineCardProps {
  cluster: TopicCluster;
}

/**
 * Truncate text to approximately the first N words.
 */
function truncateWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "...";
}

/**
 * Render a single headline card with title, summary, source, and time.
 */
function storyTimestamp(cluster: TopicCluster): Date {
  const published = cluster.published_at ? new Date(cluster.published_at) : null;
  if (published && !Number.isNaN(published.getTime())) {
    return published;
  }
  return new Date(cluster.created_at);
}

export default function HeadlineCard({ cluster }: HeadlineCardProps) {
  const timeAgo = formatDistanceToNow(storyTimestamp(cluster), {
    addSuffix: true,
  });

  const summaryPreview = truncateWords(cluster.summary, 12);

  return (
    <article
      className="p-4 mb-3 rounded-2xl bg-surface border border-border-subtle hover:bg-zinc-800/40 transition-colors cursor-pointer"
      onClick={() => (window.location.href = `/article/${cluster.id}`)}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-muted uppercase tracking-wide">
          {cluster.source_name}
        </span>
        <span className="text-zinc-600">·</span>
        <time className="text-xs text-muted">{timeAgo}</time>
      </div>

      <h2 className="text-lg font-bold text-foreground leading-snug mb-2">
        {cluster.primary_title}
      </h2>

      <p className="text-sm text-muted leading-relaxed">
        {summaryPreview}
      </p>

      {cluster.source_names.length > 1 && (
        <div className="mt-2 flex items-center gap-1">
          <span className="text-xs text-muted/80">
            +{cluster.source_names.length - 1} more source
            {cluster.source_names.length > 2 ? "s" : ""}
          </span>
        </div>
      )}
    </article>
  );
}
