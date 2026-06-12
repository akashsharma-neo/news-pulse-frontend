"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  fetchChatMessages,
  fetchChatQuota,
  sendChatMessage,
  QuotaExceededError,
  SubscriptionExpiredError,
  type ChatMessage,
  type ChatQuota,
  type TopicCluster,
} from "@/lib/api";

const DEFAULT_CHIPS = [
  "Explain context",
  "Prelims angle?",
  "Draft a practice question",
  "Related PYQs",
];

/**
 * AI Guide (PRD §3) — context-aware slide-up worksheet on every article.
 * 90% height on mobile; the LLM is scoped to this cluster by the backend.
 */
export default function AIGuidePanel({
  cluster,
  onClose,
}: {
  cluster: TopicCluster;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeLink, setShowUpgradeLink] = useState(false);
  const [quota, setQuota] = useState<ChatQuota | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Monotonic negative ids for optimistic messages (avoids impure Date.now()).
  const tempIdRef = useRef(0);

  const chips = [...new Set([...(cluster.suggested_prompts ?? []), ...DEFAULT_CHIPS])].slice(0, 6);
  const trackTag = cluster.gs_paper_tag?.split(/[–—-]/)[0]?.trim();

  useEffect(() => {
    fetchChatMessages(cluster.id).then(setMessages).catch(() => undefined);
    fetchChatQuota().then(setQuota).catch(() => undefined);
  }, [cluster.id]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && typeof el.scrollTo === "function") {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages, sending]);

  async function send(content: string) {
    const text = content.trim();
    if (!text || sending) return;
    setError(null);
    setShowUpgradeLink(false);
    setSending(true);
    tempIdRef.current -= 1;
    const optimistic: ChatMessage = {
      id: tempIdRef.current,
      role: "user",
      content: text,
      created_at: "",
    };
    setMessages((m) => [...m, optimistic]);
    setInput("");
    try {
      const res = await sendChatMessage(cluster.id, text);
      setMessages((m) => [...m, res.assistant_message]);
      setQuota(res.quota);
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        setQuota(err.quota);
        setError("Daily AI Guide limit reached. Resets at midnight — or upgrade for unlimited.");
        setShowUpgradeLink(true);
      } else if (err instanceof SubscriptionExpiredError) {
        setError("Your trial has ended. Upgrade to keep using the AI Guide.");
        setShowUpgradeLink(true);
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  }

  const remainingLabel =
    quota && quota.limit > 0 ? `${Math.max(0, quota.remaining)} left today` : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Close AI Guide"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />
      <div className="relative flex h-[90dvh] flex-col rounded-t-3xl border-t border-border-subtle bg-surface-elevated">
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-border-subtle" />

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-ai text-white">
            ✦
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[15px] font-semibold">AI Guide</h2>
            <p className="truncate label-caps text-[10px] text-accent-ai">
              {`Context: ${trackTag || "This article"}`}
            </p>
          </div>
          {remainingLabel && (
            <span className="font-mono text-[11px] text-muted">{remainingLabel}</span>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-muted hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {/* Prompt chips */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-2">
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => send(chip)}
              disabled={sending}
              className="shrink-0 rounded-full border border-accent-ai/40 px-3 py-1.5 text-[12px] text-accent-ai transition-colors hover:bg-accent-ai/10 disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-3">
          {messages.length === 0 && !sending && (
            <p className="py-8 text-center text-[13px] text-muted">
              Ask for background, trends or syllabus connections.
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed ${
                  m.role === "user"
                    ? "bg-accent text-[#0d0e14]"
                    : "bg-surface text-foreground"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-surface px-3.5 py-2.5 text-[14px] text-muted">
                Thinking…
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="px-5 pb-1">
            <p className="text-[12px] text-danger">{error}</p>
            {showUpgradeLink && (
              <Link href="/settings#subscription" className="mt-1 inline-block text-[12px] font-medium text-accent">
                View plans →
              </Link>
            )}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t border-border-subtle px-4 py-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for background, trends or syllabus connections"
            className="flex-1 rounded-full border border-border-subtle bg-surface px-4 py-2.5 text-[14px] text-foreground placeholder:text-muted focus:border-accent-ai focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            aria-label="Send"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-ai text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
              <path d="M4 12l16-8-6 16-2-6-8-2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
