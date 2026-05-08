/**
 * TabFeedPage — the main feed page.
 *
 * Renders the tab navigation bar and an infinite-scrolling list
 * of headline cards for the selected tab.
 *
 * Features:
 *   - Per-tab switching via TabNavigation
 *   - Infinite scroll (loads 20 items at a time)
 *   - Loading spinner between pages
 *   - Error state with retry button
 *   - Empty state when no clusters exist
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import TabNavigation from "@/components/TabNavigation";
import HeadlineCard from "@/components/HeadlineCard";
import { fetchClusters, TopicCluster } from "@/lib/api";

const PAGE_SIZE = 20;

export default function TabFeedPage() {
  const [activeTab, setActiveTab] = useState("india");
  const [clusters, setClusters] = useState<TopicCluster[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadClusters = useCallback(
    async (pageNum: number, append: boolean = false) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchClusters(activeTab, pageNum, PAGE_SIZE);
        if (append) {
          setClusters((prev) => [...prev, ...data.results]);
        } else {
          setClusters(data.results);
        }
        setTotal(data.count);
        setHasMore(data.next !== null);
        setPage(pageNum + 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load feed");
      } finally {
        setLoading(false);
      }
    },
    [activeTab]
  );

  // Reset on tab change
  useEffect(() => {
    setClusters([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    loadClusters(1, false);
  }, [activeTab, loadClusters]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadClusters(page, true);
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, page, loadClusters]);

  const handleRetry = () => {
    loadClusters(1, false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Tab bar — sticky at top */}
      <div className="sticky top-0 z-10 bg-white">
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Feed content */}
      <main className="max-w-2xl mx-auto">
        {/* Loading state */}
        {loading && clusters.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Loading headlines...</p>
          </div>
        )}

        {/* Error state */}
        {error && clusters.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-lg font-medium text-gray-700">Something went wrong</p>
            <p className="text-sm text-gray-400">{error}</p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-black text-white text-sm rounded-full hover:bg-gray-800 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && clusters.length === 0 && hasMore === false && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-lg font-medium text-gray-700">No headlines yet</p>
            <p className="text-sm text-gray-400">Check back later for news in this tab.</p>
          </div>
        )}

        {/* Headline cards */}
        {clusters.map((cluster) => (
          <HeadlineCard key={cluster.id} cluster={cluster} />
        ))}

        {/* Loading more */}
        {loading && clusters.length > 0 && (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
          </div>
        )}

        {/* Sentinel for infinite scroll */}
        <div ref={sentinelRef} className="h-1" />

        {/* Footer */}
        {clusters.length > 0 && (
          <div className="text-center py-6 text-xs text-gray-300">
            Showing {clusters.length} of {total} stories
          </div>
        )}
      </main>
    </div>
  );
}
