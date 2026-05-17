/**
 * TabFeedPage — the main feed page.
 *
 * Renders the tab navigation bar and an infinite-scrolling list
 * of headline cards for the selected tab.
 */

"use client";

import { useState } from "react";
import TabNavigation from "@/components/TabNavigation";
import HeadlineCard from "@/components/HeadlineCard";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

const PAGE_SIZE = 20;

export default function TabFeedPage() {
  const [activeTab, setActiveTab] = useState("india");

  const { clusters, loading, error, hasMore, totalCount, loadClusters: handleLoadClusters, sentinelRef } = useInfiniteScroll(activeTab, PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      {/* Tab bar — sticky at top */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border-subtle">
        <TabNavigation activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />
      </div>

      {/* Feed content */}
      <main className="max-w-2xl mx-auto px-3 pt-3 pb-6">
        {/* Loading state */}
        {loading && clusters.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-zinc-600 border-t-accent rounded-full animate-spin" />
            <p className="text-sm text-muted">Loading headlines...</p>
          </div>
        )}

        {/* Error state */}
        {error && clusters.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-lg font-medium text-foreground">Something went wrong</p>
            <p className="text-sm text-muted">{error}</p>
            <button
              onClick={() => handleLoadClusters(1, false)}
              className="px-4 py-2 bg-accent text-white text-sm rounded-full hover:opacity-90 transition-opacity"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && clusters.length === 0 && hasMore === false && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-lg font-medium text-foreground">No headlines yet</p>
            <p className="text-sm text-muted">Check back later for news in this tab.</p>
          </div>
        )}

        {/* Headline cards */}
        {clusters.map((cluster) => (
          <HeadlineCard key={cluster.id} cluster={cluster} />
        ))}

        {/* Loading more */}
        {loading && clusters.length > 0 && (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-zinc-600 border-t-accent rounded-full animate-spin" />
          </div>
        )}

        {/* Sentinel for infinite scroll */}
        {hasMore && !error && <div ref={sentinelRef} className="h-1" />}

        {/* Footer */}
        {clusters.length > 0 && (
          <div className="text-center py-6 text-xs text-muted/70">
            Showing {clusters.length} of {totalCount || '...'} stories
          </div>
        )}
      </main>
    </div>
  );
}