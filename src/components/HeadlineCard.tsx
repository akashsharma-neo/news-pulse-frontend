/**
 * HeadlineCard component.
 *
 * Card showing a topic cluster as a news headline.
 * Displays image, title, ~60-word summary, source attribution, and timestamp.
 */

"use client";

import { TopicCluster } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import StoryImage from "@/components/StoryImage";
import { stripHtmlToPlainText } from "@/lib/utils";

interface HeadlineCardProps {
  cluster: TopicCluster;
}

function truncateWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "...";
}

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

  const summaryPreview = truncateWords(stripHtmlToPlainText(cluster.summary), 20);
  const isSummaryTruncated = summaryPreview.endsWith("...");

  return (
    <article
      className="p-4 mb-3 rounded-2xl bg-surface border border-border-subtle hover:bg-zinc-800/40 transition-colors cursor-pointer"
      onClick={() => (window.location.href = `/article/${cluster.id}`)}
    >
      {cluster.image_url && (
        <StoryImage
          src={cluster.image_url}
          alt={cluster.primary_title}
          className="mb-3"
          aspectClass="aspect-video"
        />
      )}

      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[10px] font-semibold text-muted uppercase tracking-wide">
          {cluster.source_name}
        </span>
        <span className="text-zinc-600">·</span>
        <time className="text-[10px] text-muted">{timeAgo}</time>
      </div>

      <h2 className="text-base font-bold text-foreground leading-snug mb-1">
        {cluster.primary_title}
      </h2>

      <p className="text-xs text-muted leading-relaxed">
        {summaryPreview}
        {isSummaryTruncated && <span className="text-accent"> more</span>}
      </p>

      {cluster.source_names.length > 1 && (
        <div className="mt-1.5 flex items-center gap-1">
          <span className="text-[10px] text-muted/80">
            +{cluster.source_names.length - 1} more source
            {cluster.source_names.length > 2 ? "s" : ""}
          </span>
        </div>
      )}
    </article>
  );
}
