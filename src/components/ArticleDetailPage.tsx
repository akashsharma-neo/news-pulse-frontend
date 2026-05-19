/**
 * ArticleDetailPage — The full view of a news story cluster.
 *
 * Displays summary, source information, related stories, and chat access.
 */

"use client";

import { useEffect, useState } from "react";
import { fetchCluster, fetchRelatedClusters, TopicCluster } from "@/lib/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import SlideOutChatPanel from "@/components/SlideOutChatPanel";
import StoryImage from "@/components/StoryImage";
import { sanitizePlainText, stripHtmlToPlainText } from "@/lib/utils";

function RelatedStoryRow({ item }: { item: TopicCluster }) {
  const timeAgo = formatDistanceToNow(
    new Date(item.published_at || item.created_at),
    { addSuffix: true }
  );

  return (
    <Link
      href={`/article/${item.id}`}
      className="block p-4 rounded-xl bg-surface border border-border-subtle hover:bg-zinc-800/40 transition-colors"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-semibold text-muted uppercase tracking-wide">
          {sanitizePlainText(item.source_name)}
        </span>
        <span className="text-zinc-600">·</span>
        <time className="text-xs text-muted">{timeAgo}</time>
      </div>
      <h3 className="text-base font-semibold text-foreground leading-snug">
        {item.primary_title}
      </h3>
    </Link>
  );
}

export default function ArticleDetailPage() {
  const params = useParams();
  const [cluster, setCluster] = useState<TopicCluster | null>(null);
  const [related, setRelated] = useState<TopicCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const isValidId = typeof params.id === "string" && !isNaN(Number(params.id));

  useEffect(() => {
    if (!isValidId) {
      setTimeout(() => setLoading(false), 0);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setRelatedLoading(true);

    const id = Number(params.id);
    const loadData = async () => {
      try {
        const [data, relatedItems] = await Promise.all([
          fetchCluster(id),
          fetchRelatedClusters(id),
        ]);
        setCluster(data);
        setRelated(relatedItems);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load article");
      } finally {
        setLoading(false);
        setRelatedLoading(false);
      }
    };

    loadData();
  }, [params.id, isValidId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-zinc-600 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !cluster) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background px-4">
        <p className="text-lg font-medium text-foreground">
          {!isValidId ? "Invalid or missing article identifier" : (error || "Article not found")}
        </p>
        <Link href="/" className="text-accent hover:underline">Back to feed</Link>
      </div>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(cluster.published_at), {
    addSuffix: true,
  });
  const summaryText = stripHtmlToPlainText(cluster.summary);

  return (
    <main className="max-w-2xl mx-auto min-h-screen bg-background pb-20">
      <div className="p-4 border-b border-border-subtle bg-surface">
        <Link href="/" className="text-sm text-muted hover:text-foreground transition-colors">
          ← Back to Feed
        </Link>
      </div>

      <article className="p-6">
        {cluster.image_url && (
          <StoryImage
            src={cluster.image_url}
            alt={cluster.primary_title}
            className="mb-6"
            aspectClass="aspect-[2/1]"
          />
        )}

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold text-muted uppercase tracking-wide">
            {sanitizePlainText(cluster.source_name)}
          </span>
          <span className="text-zinc-600">·</span>
          <time className="text-xs text-muted">{timeAgo}</time>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight mb-6">
          {cluster.primary_title}
        </h1>

        <div className="mb-8">
          <p className="text-lg text-muted leading-relaxed whitespace-pre-wrap">
            {summaryText}
          </p>
          {cluster.primary_url && (
            <a
              href={cluster.primary_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-sm font-medium text-accent hover:underline"
            >
              More at {sanitizePlainText(cluster.source_name)}
            </a>
          )}
        </div>

        <div className="border-t border-border-subtle pt-6 mb-8">
          <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
            Sources contributing to this story
          </h3>
          <div className="flex flex-wrap gap-2">
            {cluster.source_names.map((name) => (
              <span
                key={name}
                className="px-3 py-1 bg-surface-elevated text-muted text-xs rounded-full border border-border-subtle"
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        <div className="sticky bottom-4 mt-auto">
          <button
            className="w-full bg-accent text-white font-medium py-4 rounded-2xl shadow-lg hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            onClick={() => setIsChatOpen(true)}
          >
            <span className="text-lg">💬</span>
            Want more? Just Ask
          </button>
        </div>
      </article>

      <section className="px-6 pb-8">
        <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
          More news
        </h2>
        {relatedLoading ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-zinc-600 border-t-accent rounded-full animate-spin" />
          </div>
        ) : related.length === 0 ? (
          <p className="text-sm text-muted">No related stories right now.</p>
        ) : (
          <div className="space-y-3">
            {related.map((item) => (
              <RelatedStoryRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      <SlideOutChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        articleId={Number(params.id)}
      />
    </main>
  );
}
