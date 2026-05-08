/**
 * TabNavigation component.
 *
 * Horizontal tab bar for browsing news by category.
 * Displays all available tabs with the active tab highlighted.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Tab, fetchTabs } from "@/lib/api";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

/**
 * Fetch tabs from the API and render as a horizontal scrollable bar.
 * Falls back to a hardcoded list if the API is unavailable.
 */
export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTabs = useCallback(async () => {
    try {
      const data = await fetchTabs();
      setTabs(data);
    } catch {
      // Fallback tabs if API is down
      setTabs([
        { id: 0, name: "India", slug: "india", order: 1 },
        { id: 0, name: "Just For You", slug: "just-for-you", order: 2 },
        { id: 0, name: "Sports", slug: "sports", order: 3 },
        { id: 0, name: "Business", slug: "business", order: 4 },
        { id: 0, name: "Global", slug: "global", order: 5 },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTabs();
  }, [loadTabs]);

  if (loading) {
    return (
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-9 min-w-[80px] rounded-full bg-gray-200 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide border-b border-gray-100">
      {tabs.map((tab) => (
        <button
          key={tab.slug}
          onClick={() => onTabChange(tab.slug)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === tab.slug
              ? "bg-black text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {tab.name}
        </button>
      ))}
    </div>
  );
}
