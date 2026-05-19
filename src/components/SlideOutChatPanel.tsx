/**
 * SlideOutChatPanel component.
 *
 * A side-panel (or bottom sheet on mobile) that provides a chat interface
 * for users to interact with the AI about the current article context.
 */

"use client";

import { useEffect, useState, useRef } from "react";
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

const TIMEOUT_SECONDS = 20;

export default function SlideOutChatPanel({ isOpen, onClose, articleId }: SlideOutChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastSentContentRef = useRef<string>("");
  const isTimedOut = elapsedTime >= TIMEOUT_SECONDS;

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isLoading) {
      startTimeRef.current = Date.now();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setElapsedTime(0);

      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    } else {
      setElapsedTime(0);
      startTimeRef.current = null;
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  const performSend = async (content: string) => {
    setError(null);
    lastSentContentRef.current = content;

    const tempId = Date.now();
    const optimisticMessage: ChatMessage = {
      id: tempId,
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setIsLoading(true);

    try {
      const { user_message, assistant_message } = await sendChatMessage(articleId, content);
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== tempId).concat([user_message, assistant_message])
      );
    } catch (err) {
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const content = input.trim();
    setInput("");
    performSend(content);
  };

  const handleRetry = () => {
    setError(null);
    if (lastSentContentRef.current) {
      performSend(lastSentContentRef.current);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (error) setError(null);
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
      <div className="fixed bottom-0 right-0 left-0 md:left-auto md:top-0 md:bottom-auto md:w-[400px] md:h-[calc(100vh-64px)] md:top-[64px] bg-surface z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out border-t md:border-l md:border-t-0 border-border-subtle rounded-t-2xl md:rounded-none max-h-[85vh] md:max-h-none">
        {/* Header */}
        <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-surface-elevated shrink-0">
          <h3 className="font-bold text-foreground">Chat with AI</h3>
          <button 
            onClick={onClose} 
            className="text-muted hover:text-foreground p-2 rounded-lg transition-colors"
            aria-label="Close chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {isLoadingHistory && (
            <div className="flex justify-center py-8">
              <div className="flex items-center gap-2 text-muted">
                <div className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          {!isLoadingHistory && messages.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <p className="text-sm text-muted mb-2">
                Ask anything about this article!
              </p>
              <p className="text-xs text-muted/60">
                AI usually replies in a few seconds
              </p>
            </div>
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
          
          {/* Loading / Thinking State */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-surface-elevated border border-border-subtle p-3 rounded-2xl rounded-tl-none">
                {isTimedOut ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-orange-400">
                      Taking longer than expected...
                    </p>
                    <button
                      onClick={handleRetry}
                      className="text-xs bg-orange-500/20 text-orange-400 px-3 py-1.5 rounded-lg hover:bg-orange-500/30 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs text-muted">
                      thinking and searching{elapsedTime > 5 && ` (${elapsedTime}s)`}...
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border-subtle bg-surface shrink-0">
          {error && (
            <div className="flex items-center justify-between mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
              <button
                onClick={handleRetry}
                className="text-xs text-red-400 hover:text-red-300 ml-2 shrink-0"
              >
                Retry
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Ask something..."
              disabled={isLoading}
              className="flex-1 bg-zinc-800 text-foreground placeholder:text-muted border-none rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent transition-all outline-none disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-accent text-white p-2.5 rounded-full disabled:opacity-50 hover:opacity-90 transition-opacity"
              aria-label="Send message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}