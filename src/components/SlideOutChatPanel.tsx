/**
 * SlideOutChatPanel component.
 *
 * A side-panel (or bottom sheet on mobile) that provides a chat interface
 * for users to interact with the AI about the current article context.
 */

"use client";

import { useEffect, useState } from "react";
import {
  fetchChatMessages,
  sendChatMessage,
  type ChatMessage,
} from "@/lib/api";

interface SlideOutChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  articleId: number;
}

export default function SlideOutChatPanel({ isOpen, onClose, articleId }: SlideOutChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const loadHistory = async () => {
      setIsLoadingHistory(true);
      setError(null);
      try {
        const history = await fetchChatMessages(articleId);
        if (!cancelled) setMessages(history);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load chat history");
        }
      } finally {
        if (!cancelled) setIsLoadingHistory(false);
      }
    };

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [isOpen, articleId]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const content = input.trim();
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const { user_message, assistant_message } = await sendChatMessage(articleId, content);
      setMessages((prev) => [...prev, user_message, assistant_message]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed bottom-0 right-0 left-0 md:left-auto md:top-0 md:bottom-auto md:w-[400px] h-[80vh] bg-surface z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out border-t md:border-l md:border-t-0 border-border-subtle rounded-t-2xl md:rounded-none">
        {/* Header */}
        <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-surface-elevated">
          <h3 className="font-bold text-foreground">Chat with AI</h3>
          <button onClick={onClose} className="text-muted hover:text-foreground p-1 rounded-lg transition-colors">
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoadingHistory && (
            <p className="text-center text-sm text-muted mt-10">Loading conversation...</p>
          )}
          {!isLoadingHistory && messages.length === 0 && (
            <p className="text-center text-sm text-muted mt-10">
              Ask anything about this article!
            </p>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  msg.role === "user"
                    ? "bg-accent text-white rounded-tr-none"
                    : "bg-surface-elevated text-foreground rounded-tl-none border border-border-subtle"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-surface-elevated border border-border-subtle p-3 rounded-2xl rounded-tl-none animate-pulse text-sm text-muted">
                Typing...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border-subtle bg-surface">
          {error && (
            <p className="text-sm text-red-400 mb-2" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
              disabled={isLoading}
              className="flex-1 bg-zinc-800 text-foreground placeholder:text-muted border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-accent transition-all outline-none disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-accent text-white p-2 rounded-full disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
