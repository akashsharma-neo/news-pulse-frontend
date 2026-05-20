"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function AppHeader() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle bg-surface">
      <Link href="/" className="text-sm font-semibold text-foreground hover:text-accent transition-colors">
        NewsMine
      </Link>
      <div className="flex items-center gap-2">
        {loading ? (
          <span className="text-xs text-muted">...</span>
        ) : isAuthenticated && user ? (
          <>
            <span className="text-xs text-muted max-w-[140px] truncate hidden sm:inline">
              {user.name || user.email}
            </span>
            <button
              type="button"
              onClick={() => logout()}
              className="text-xs px-3 py-1.5 rounded-full border border-border-subtle text-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
            >
              Sign out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="text-xs px-3 py-1.5 rounded-full bg-accent text-white hover:opacity-90 transition-opacity"
          >
            Sign in
          </Link>
        )}
      </div>
    </div>
  );
}
