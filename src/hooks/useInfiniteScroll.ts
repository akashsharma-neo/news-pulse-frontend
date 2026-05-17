import { useState, useEffect, useCallback, useRef } from "react";
import { fetchClusters, TopicCluster } from "@/lib/api";

type PageState = {
  clusters: TopicCluster[];
  page: number;
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  totalCount: number;
};

export const useInfiniteScroll = (tabId: string, pageSize: number = 20) => {
  const [state, setState] = useState<PageState>({
    clusters: [],
    page: 1,
    loading: false,
    hasMore: true,
    error: null,
    totalCount: 0,
  });

  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const pageRef = useRef(1);

  useEffect(() => {
    hasMoreRef.current = state.hasMore;
    pageRef.current = state.page;
  }, [state.hasMore, state.page]);

  const loadClusters = useCallback(async (pageNum: number, append: boolean = false) => {
    if (loadingRef.current || !hasMoreRef.current) return;
    
    loadingRef.current = true;
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await fetchClusters(tabId, pageNum, pageSize);

      setState(prev => ({
        ...prev,
        clusters: append ? [...prev.clusters, ...data.results] : data.results,
        totalCount: data.count,
        hasMore: data.next !== null,
        loading: false,
        page: pageNum + 1,
      }));
      hasMoreRef.current = data.next !== null;
      loadingRef.current = false;
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : "Failed to load feed",
        loading: false,
      }));
      loadingRef.current = false;
    }
  }, [tabId, pageSize]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
          loadClusters(pageRef.current, true);
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [loadClusters]);

  useEffect(() => {
    setState({
      clusters: [],
      page: 1,
      loading: false,
      hasMore: true,
      error: null,
      totalCount: 0,
    });
    loadingRef.current = false;
    hasMoreRef.current = true;
    pageRef.current = 1;
    
    if (tabId) {
      loadClusters(1, false);
    }
  }, [tabId, loadClusters]);

  const handleLoadClusters = useCallback((pageNum: number, append: boolean = false) => {
    if (!append) {
      setState(prev => ({ ...prev, clusters: [], page: 1, hasMore: true, error: null }));
    }
    loadClusters(pageNum, append);
  }, [loadClusters]);

  return { ...state, loadClusters: handleLoadClusters, sentinelRef };
};