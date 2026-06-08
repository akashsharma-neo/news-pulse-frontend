"use client";

import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import TabNavigation from "@/components/TabNavigation";
import HeadlineCard from "@/components/HeadlineCard";
import SearchBar from "@/components/SearchBar";
import SearchResults from "@/components/SearchResults";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { fetchSearchResults, SearchResult } from "@/lib/api";

const PAGE_SIZE = 20;

export default function TabFeedPage() {
  const [activeTab, setActiveTab] = useState("india");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchPage, setSearchPage] = useState(1);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const { clusters, loading, error, hasMore, totalCount, loadClusters, sentinelRef } = useInfiniteScroll(activeTab, PAGE_SIZE);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setShowSearch(true);
    setSearchLoading(true);
    setSearchPage(1);
    try {
      const data = await fetchSearchResults(query, activeTab, 1);
      setSearchResults(data.results);
      setSearchTotal(data.count);
      setSearchHasMore(data.next !== null);
    } catch {
      setSearchResults([]);
      setSearchTotal(0);
      setSearchHasMore(false);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleLoadMoreSearch = async () => {
    if (searchLoading || !searchHasMore) return;
    setSearchLoading(true);
    const nextPage = searchPage + 1;
    try {
      const data = await fetchSearchResults(searchQuery, activeTab, nextPage);
      setSearchResults((prev) => [...prev, ...data.results]);
      setSearchPage(nextPage);
      setSearchHasMore(data.next !== null);
    } catch {
      // ignore
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClearSearch = () => {
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearchTotal(0);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      {/* Tab bar — sticky at top */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border-subtle">
        <TabNavigation activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); handleClearSearch(); }} />
        <div className="px-3 pb-2">
          <SearchBar onSearch={handleSearch} />
        </div>
      </div>

      {/* Feed content */}
      <main className="max-w-2xl mx-auto px-3 pt-3 pb-6">
        {showSearch ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-foreground">Search Results</h2>
              <button
                onClick={handleClearSearch}
                className="text-xs text-accent hover:underline"
              >
                Back to feed
              </button>
            </div>
            <SearchResults
              results={searchResults}
              query={searchQuery}
              loading={searchLoading}
              totalCount={searchTotal}
              onLoadMore={handleLoadMoreSearch}
              hasMore={searchHasMore}
            />
          </>
        ) : (
          <>
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
                  onClick={() => loadClusters(1, false)}
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
          </>
        )}
      </main>
    </div>
  );
}
