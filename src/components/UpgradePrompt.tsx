"use client";

import Link from "next/link";

interface UpgradePromptProps {
  isGuest: boolean;
}

export default function UpgradePrompt({ isGuest }: UpgradePromptProps) {
  return (
    <div className="p-4 bg-gradient-to-br from-accent/10 to-purple-500/10 border border-accent/20 rounded-2xl text-center">
      <div className="mb-3">
        <div className="w-12 h-12 mx-auto bg-accent/20 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </div>
      </div>
      <h4 className="font-semibold text-foreground mb-1">
        {isGuest ? "Want more AI chats?" : "Need more AI chats?"}
      </h4>
      <p className="text-sm text-muted mb-4">
        {isGuest
          ? "Sign up for free to get 200 AI chats per month. Or subscribe for unlimited access."
          : "Subscribe for unlimited AI chats and exclusive features."}
      </p>
      {isGuest ? (
        <div className="flex gap-2 justify-center">
          <Link
            href="/signup"
            className="bg-accent text-white text-sm px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
          >
            Sign Up Free
          </Link>
          <button className="bg-surface-elevated text-foreground text-sm px-4 py-2 rounded-full border border-border-subtle hover:bg-zinc-700 transition-colors">
            Learn More
          </button>
        </div>
      ) : (
        <button className="bg-accent text-white text-sm px-6 py-2 rounded-full hover:opacity-90 transition-opacity">
          Subscribe
        </button>
      )}
    </div>
  );
}
