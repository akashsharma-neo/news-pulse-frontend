/**
 * SlideOutChatPanel component.
 * 
 * A side-panel (or bottom sheet on mobile) that provides a chat interface
 * for users to interact with the AI about the current article context.
 */

"use client";

import { useState } from "react";

interface SlideOutChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  articleId: number;
}

export default function SlideOutChatPanel({ isOpen, onClose, articleId }: SlideOutChatPanelProps) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: { role: "user"; content: string } = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // In 3.1 we will implement the actual API call
      // For now, simulate a response
      setTimeout(() => {
        const aiResponse: { role: "assistant"; content: string } = {
          role: "assistant",
          content: `I am processing your question about article ${articleId}. The real chat API is coming in task 3.1!`,
        };
        setMessages((prev) => [...prev, aiResponse]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to send message:", error);
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
          {messages.length === 0 && (
            <p className="text-center text-sm text-muted mt-10">
              Ask anything about this article!
            </p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
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
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
              className="flex-1 bg-zinc-800 text-foreground placeholder:text-muted border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-accent transition-all outline-none"
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
