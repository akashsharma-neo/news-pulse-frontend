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
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed bottom-0 right-0 left-0 md:left-auto md:top-0 md:bottom-auto md:w-[400px] h-[80vh] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out border-t md:border-l md:border-t-0 border-gray-200 rounded-t-2xl md:rounded-none">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h3 className="font-bold text-gray-900">Chat with AI</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black p-1">
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <p className="text-center text-sm text-gray-400 mt-10">
              Ask anything about this article!
            </p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                msg.role === "user" 
                  ? "bg-black text-white rounded-tr-none" 
                  : "bg-gray-100 text-gray-800 rounded-tl-none"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none animate-pulse text-sm text-gray-500">
                Typing...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
              className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-black transition-all outline-none"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-black text-white p-2 rounded-full disabled:opacity-50 hover:bg-gray-800 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
