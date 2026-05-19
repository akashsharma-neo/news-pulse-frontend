/**
 * HeadlineCard component.
 *
 * Horizontal card layout — image on the left, article text on the right.
 * Text is truncated via CSS line-clamp to fit the tile.
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

  const summaryPreview = truncateWords(stripHtmlToPlainText(cluster.summary), 35);

  return (
    <article
      className="p-3 mb-3 rounded-2xl bg-surface border border-border-subtle hover:bg-zinc-800/40 transition-colors cursor-pointer"
      onClick={() => (window.location.href = `/article/${cluster.id}`)}
    >
      <div className="flex gap-3">
        {cluster.image_url && (
          <div className="w-24 md:w-32 shrink-0">
            <StoryImage
              src={cluster.image_url}
              alt={cluster.primary_title}
              aspectClass="aspect-square"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wide">
              {cluster.source_name}
            </span>
            <span className="text-zinc-600">·</span>
            <time className="text-xs text-muted">{timeAgo}</time>
          </div>

          <h2 className="text-base font-bold text-foreground leading-snug mb-1 line-clamp-2">
            {cluster.primary_title}
          </h2>

          <p className="text-sm text-muted leading-relaxed line-clamp-3">
            {summaryPreview}
          </p>

          {cluster.source_names.length > 1 && (
            <div className="mt-1 flex items-center gap-1">
              <span className="text-xs text-muted/80">
                +{cluster.source_names.length - 1} more source
                {cluster.source_names.length > 2 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
