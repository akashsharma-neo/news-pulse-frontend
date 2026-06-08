"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthCard from "@/components/AuthCard";
import { useAuth } from "@/contexts/AuthContext";

function CheckEmailContent() {
  const params = useSearchParams();
  const initialEmail = params.get("email") ?? "";
  const { resendVerificationEmail } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      await resendVerificationEmail(email.trim());
      setMessage("If an account exists for this email, we sent a new verification link.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Check your email"
      subtitle="We sent a verification link. Click it to activate your account before signing in."
      footer={
        <Link href="/login" className="text-accent hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleResend} className="space-y-3">
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-foreground placeholder:text-muted text-sm"
          required
        />
        {message && <p className="text-sm text-accent">{message}</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-full bg-surface-elevated border border-border-subtle text-foreground text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Sending…" : "Resend verification email"}
        </button>
      </form>
    </AuthCard>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthCard title="Check your email">
          <p className="text-sm text-muted text-center">Loading…</p>
        </AuthCard>
      }
    >
      <CheckEmailContent />
    </Suspense>
  );
}
