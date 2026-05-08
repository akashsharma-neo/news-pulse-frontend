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
export default function HeadlineCard({ cluster }: HeadlineCardProps) {
  const timeAgo = formatDistanceToNow(new Date(cluster.published_at), {
    addSuffix: true,
  });

  const summaryPreview = truncateWords(cluster.summary, 12);

  return (
    <article className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => window.location.href = `/article/${cluster.id}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {cluster.source_name}
        </span>
        <span className="text-gray-300">·</span>
        <time className="text-xs text-gray-400">{timeAgo}</time>
      </div>

      <h2 className="text-lg font-bold text-gray-900 leading-snug mb-2">
        {cluster.primary_title}
      </h2>

      <p className="text-sm text-gray-600 leading-relaxed">
        {summaryPreview}
      </p>

      {cluster.source_names.length > 1 && (
        <div className="mt-2 flex items-center gap-1">
          <span className="text-xs text-gray-400">
            +{cluster.source_names.length - 1} more source
            {cluster.source_names.length > 2 ? "s" : ""}
          </span>
        </div>
      )}
    </article>
  );
}
