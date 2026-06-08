"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import AuthCard from "@/components/AuthCard";
import PhoneAuthForm from "@/components/PhoneAuthForm";
import { useAuth } from "@/contexts/AuthContext";
import { AuthApiError } from "@/lib/auth-api";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const { login, signInWithFirebaseIdToken } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPhone, setShowPhone] = useState(false);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace("/");
    } catch (err) {
      if (err instanceof AuthApiError && err.code === "email_not_verified") {
        router.push(`/auth/check-email?email=${encodeURIComponent(email.trim())}`);
        return;
      }
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        setError("Google sign-in is not configured.");
        return;
      }
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      await signInWithFirebaseIdToken(idToken);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Sign in"
      subtitle="Continue with Google, phone, or email"
      footer={
        <>
          No account?{" "}
          <Link href="/signup" className="text-accent hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        {isFirebaseConfigured() && (
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-2.5 rounded-full bg-surface-elevated border border-border-subtle text-foreground text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            <span>Continue with Google</span>
          </button>
        )}

        {isFirebaseConfigured() && (
          <div>
            <button
              type="button"
              onClick={() => setShowPhone((v) => !v)}
              className="w-full py-2.5 rounded-full bg-surface-elevated border border-border-subtle text-foreground text-sm font-medium hover:bg-zinc-700 transition-colors"
            >
              {showPhone ? "Hide phone sign-in" : "Sign in with phone"}
            </button>
            {showPhone && (
              <div className="mt-3 pt-3 border-t border-border-subtle">
                <PhoneAuthForm />
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border-subtle" />
          <span className="text-xs text-muted">or email</span>
          <div className="flex-1 h-px bg-border-subtle" />
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-3">
          <input
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-foreground placeholder:text-muted text-sm"
            required
          />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-foreground placeholder:text-muted text-sm"
            required
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-full bg-accent text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Signing in…" : "Sign in with email"}
          </button>
        </form>
      </div>
    </AuthCard>
  );
}
