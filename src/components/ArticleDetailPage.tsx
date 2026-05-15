/**
 * ArticleDetailPage — The full view of a news story cluster.
 *
 * Displays summary, source information, and provides access to the chat interface.
 */

"use client";

import { useEffect, useState } from "react";
import { fetchCluster, TopicCluster } from "@/lib/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import SlideOutChatPanel from "@/components/SlideOutChatPanel";

export default function ArticleDetailPage() {
  const params = useParams();
  const [cluster, setCluster] = useState<TopicCluster | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (!params.id) return;

    const loadData = async () => {
      try {
        const data = await fetchCluster(Number(params.id));
        setCluster(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load article");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params.id]);

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
        <p className="text-lg font-medium text-foreground">{error || "Article not found"}</p>
        <Link href="/" className="text-accent hover:underline">
          Back to feed
        </Link>
      </div>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(cluster.published_at), {
    addSuffix: true,
  });

  return (
    <main className="max-w-2xl mx-auto min-h-screen bg-background pb-20">
      {/* Back button */}
      <div className="p-4 border-b border-border-subtle bg-surface">
        <Link href="/" className="text-sm text-muted hover:text-foreground transition-colors">
          ← Back to Feed
        </Link>
      </div>

      <article className="p-6">
        {/* Header info */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold text-muted uppercase tracking-wide">
            {cluster.source_name}
          </span>
          <span className="text-zinc-600">·</span>
          <time className="text-xs text-muted">{timeAgo}</time>
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight mb-6">
          {cluster.primary_title}
        </h1>

        {/* Summary Section */}
        <div className="mb-8">
          <p className="text-lg text-muted leading-relaxed">
            {cluster.summary}
          </p>
        </div>

        {/* Sources Section */}
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

        {/* Action: Chat Button */}
        <div className="sticky bottom-4 mt-auto">
          <button
            className="w-full bg-accent text-white font-medium py-4 rounded-2xl shadow-lg hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            onClick={() => setIsChatOpen(true)}
          >
            <span className="text-lg">💬</span>
            Ask AI about this story
          </button>
        </div>
      </article>

      <SlideOutChatPanel 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        articleId={Number(params.id)} 
      />
    </main>
  );
}
