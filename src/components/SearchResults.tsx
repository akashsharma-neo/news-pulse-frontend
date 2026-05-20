"use client";

import { SearchResult } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { stripHtmlToPlainText } from "@/lib/utils";

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  loading: boolean;
  totalCount: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

function truncateWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "...";
}

export default function SearchResults({ results, query, loading, totalCount, onLoadMore, hasMore }: SearchResultsProps) {
  if (!loading && results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2">
        <p className="text-lg font-medium text-foreground">No results found</p>
        <p className="text-sm text-muted">
          No articles match &ldquo;{query}&rdquo;. Try a different search term.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-muted mb-3 px-1">
        {totalCount} result{totalCount !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
      </p>

      {results.map((article) => {
        const timeAgo = formatDistanceToNow(new Date(article.published_at), { addSuffix: true });
        const preview = truncateWords(stripHtmlToPlainText(article.summary || article.headline), 25);
        return (
          <article
            key={article.id}
            className="p-4 mb-3 rounded-2xl bg-surface border border-border-subtle hover:bg-zinc-800/40 transition-colors cursor-pointer"
            onClick={() => window.open(article.url, "_blank", "noopener noreferrer")}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wide">
                {article.source_name}
              </span>
              <span className="text-zinc-600">·</span>
              <time className="text-[10px] text-muted">{timeAgo}</time>
            </div>

            <h2 className="text-base font-bold text-foreground leading-snug mb-1">
              {article.title}
            </h2>

            <p className="text-xs text-muted leading-relaxed">{preview}</p>
          </article>
        );
      })}

      {loading && (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-zinc-600 border-t-accent rounded-full animate-spin" />
        </div>
      )}

      {hasMore && !loading && onLoadMore && (
        <div className="flex justify-center py-4">
          <button
            onClick={onLoadMore}
            className="px-4 py-2 bg-accent text-white text-sm rounded-full hover:opacity-90 transition-opacity"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
