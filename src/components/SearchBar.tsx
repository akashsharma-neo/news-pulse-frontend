"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { fetchSuggestions, fetchTrending, Suggestion, TrendingItem } from "@/lib/api";

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function SearchBar({ onSearch, initialQuery = "" }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debouncedQuery = useDebounce(query, 200);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSuggestions([]);
      return;
    }
    fetchSuggestions(debouncedQuery).then(setSuggestions).catch(() => setSuggestions([]));
  }, [debouncedQuery]);

  useEffect(() => {
    if (!query.trim()) {
      fetchTrending().then(setTrending).catch(() => setTrending([]));
    }
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSubmit = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setShowDropdown(false);
    onSearch(trimmed);
  }, [onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = query.trim() ? suggestions : trending;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i < items.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i > 0 ? i - 1 : items.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && items[activeIdx]) {
        const item = items[activeIdx];
        handleSubmit("text" in item ? (item as Suggestion).text : (item as TrendingItem).text);
      } else {
        handleSubmit(query);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const dropdownItems = query.trim() ? suggestions : trending;

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-surface border border-border-subtle rounded-xl px-3 py-2 focus-within:border-accent transition-colors">
        <svg className="w-4 h-4 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); setActiveIdx(-1); }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search news..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder-muted outline-none"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setSuggestions([]); setShowDropdown(false); inputRef.current?.focus(); }}
            className="text-muted hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {showDropdown && dropdownItems.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border-subtle rounded-xl shadow-lg z-20 overflow-hidden"
        >
          {!query.trim() && trending.length > 0 && (
            <div className="px-3 pt-2 pb-1 text-[10px] font-semibold text-muted uppercase tracking-wide">
              Trending
            </div>
          )}
          {dropdownItems.map((item, idx) => {
            const text = "text" in item ? (item as Suggestion).text : (item as TrendingItem).text;
            const type = "type" in item ? item.type : "";
            const isActive = idx === activeIdx;
            return (
              <button
                key={`${type}-${text}`}
                onMouseDown={(e) => { e.preventDefault(); handleSubmit(text); }}
                onMouseEnter={() => setActiveIdx(idx)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                  isActive ? "bg-zinc-700/50 text-foreground" : "text-muted hover:bg-zinc-800/50"
                }`}
              >
                {type === "tab" && (
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16 4 16m-6-4h4" />
                  </svg>
                )}
                {type === "cluster" && (
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                )}
                {(type === "keyword" || type === "title") && (
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
                <span className="truncate">{text}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
