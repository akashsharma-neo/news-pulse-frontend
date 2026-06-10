"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ConfirmationResult,
  GoogleAuthProvider,
  OAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
} from "firebase/auth";
import { useAuth } from "@/contexts/AuthContext";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import NexLogo from "../brand/NexLogo";

/**
 * NexPrep auth (PRD §1). Phone OTP is the primary path; Google and Apple are
 * one-tap social options. All providers go through Firebase → /api/auth/firebase/.
 * Onboarding (track + language) is collected after auth by AppGate.
 */
export default function AuthScreen() {
  const { signInWithFirebaseIdToken } = useAuth();
  const router = useRouter();
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [busy, setBusy] = useState<"google" | "apple" | "phone" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      verifierRef.current?.clear();
      verifierRef.current = null;
    };
  }, []);

  const configured = isFirebaseConfigured();

  async function afterSignIn(idToken: string) {
    await signInWithFirebaseIdToken(idToken);
    router.replace("/");
  }

  async function handleSocial(kind: "google" | "apple") {
    setError(null);
    setBusy(kind);
    try {
      const auth = getFirebaseAuth();
      if (!auth) throw new Error("Sign-in is not configured.");
      const provider =
        kind === "google"
          ? new GoogleAuthProvider()
          : new OAuthProvider("apple.com");
      if (kind === "apple") {
        (provider as OAuthProvider).addScope("email");
        (provider as OAuthProvider).addScope("name");
      }
      const cred = await signInWithPopup(auth, provider);
      const idToken = await cred.user.getIdToken();
      await afterSignIn(idToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
      setBusy(null);
    }
  }

  async function getVerifier(): Promise<RecaptchaVerifier> {
    const auth = getFirebaseAuth();
    if (!auth || !recaptchaRef.current) throw new Error("Firebase is not ready.");
    if (!verifierRef.current) {
      verifierRef.current = new RecaptchaVerifier(auth, recaptchaRef.current, {
        size: "invisible",
      });
    }
    return verifierRef.current;
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy("phone");
    try {
      const auth = getFirebaseAuth();
      if (!auth) throw new Error("Firebase is not configured.");
      const normalized = phone.trim().startsWith("+") ? phone.trim() : `+${phone.trim()}`;
      const verifier = await getVerifier();
      confirmationRef.current = await signInWithPhoneNumber(auth, normalized, verifier);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the code.");
    } finally {
      setBusy(null);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy("phone");
    try {
      const confirmation = confirmationRef.current;
      if (!confirmation) throw new Error("Request a code first.");
      const cred = await confirmation.confirm(code.trim());
      const idToken = await cred.user.getIdToken();
      await afterSignIn(idToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code.");
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 flex flex-col items-center text-center">
        <NexLogo className="h-12 w-12" />
        <h1 className="mt-4 font-display text-2xl font-bold">Welcome to NexPrep</h1>
        <p className="mt-1 text-[14px] text-muted">
          Start your 7-day free trial. No card required.
        </p>
      </div>

      {!configured && (
        <p className="mb-4 rounded-xl border border-border-subtle bg-surface p-3 text-center text-[13px] text-muted">
          Sign-in is not configured yet. Add the Firebase env vars to enable
          phone, Google and Apple login.
        </p>
      )}

      {/* Phone OTP — primary */}
      {step === "phone" ? (
        <form onSubmit={handleSendCode} className="space-y-3">
          <label className="label-caps block text-[10px] text-muted">
            Phone number
          </label>
          <input
            type="tel"
            inputMode="tel"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={!configured}
            className="w-full rounded-xl border border-border-subtle bg-surface px-4 py-3 text-[15px] text-foreground placeholder:text-muted focus:border-accent focus:outline-none disabled:opacity-50"
            required
          />
          <div ref={recaptchaRef} />
          <button
            type="submit"
            disabled={!configured || busy !== null}
            className="w-full rounded-xl bg-accent py-3.5 font-display text-[15px] font-semibold text-[#0d0e14] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy === "phone" ? "Sending…" : "Continue with phone"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-3">
          <p className="text-[13px] text-muted">Enter the code sent to {phone}</p>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-xl border border-border-subtle bg-surface px-4 py-3 text-center font-mono text-lg tracking-[0.4em] text-foreground placeholder:tracking-normal placeholder:text-muted focus:border-accent focus:outline-none"
            required
          />
          <button
            type="submit"
            disabled={busy !== null}
            className="w-full rounded-xl bg-accent py-3.5 font-display text-[15px] font-semibold text-[#0d0e14] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy === "phone" ? "Verifying…" : "Verify & continue"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setCode("");
              setError(null);
            }}
            className="w-full text-[13px] text-muted hover:text-foreground"
          >
            Use a different number
          </button>
        </form>
      )}

      {error && <p className="mt-3 text-center text-[13px] text-danger">{error}</p>}

      {step === "phone" && (
        <>
          <div className="my-6 flex items-center gap-3 text-[11px] text-muted">
            <span className="h-px flex-1 bg-border-subtle" />
            OR
            <span className="h-px flex-1 bg-border-subtle" />
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleSocial("google")}
              disabled={!configured || busy !== null}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-border-subtle bg-surface py-3.5 text-[15px] font-medium text-foreground transition-colors hover:bg-surface-elevated disabled:opacity-50"
            >
              <GoogleIcon />
              {busy === "google" ? "Connecting…" : "Continue with Google"}
            </button>
            <button
              type="button"
              onClick={() => handleSocial("apple")}
              disabled={!configured || busy !== null}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-border-subtle bg-surface py-3.5 text-[15px] font-medium text-foreground transition-colors hover:bg-surface-elevated disabled:opacity-50"
            >
              <AppleIcon />
              {busy === "apple" ? "Connecting…" : "Continue with Apple"}
            </button>
          </div>
        </>
      )}

      <p className="mt-8 text-center text-[11px] leading-relaxed text-muted">
        By continuing you agree to our Terms and Privacy Policy.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5h-1.9V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.6 5.1C9.6 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.5l6.3 5.3C41 39 44 32.6 44 24c0-1.3-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M16.4 12.8c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.8-3.5.8s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.2 0 2-1.1 2.8-2.2.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.8zM14.1 5.9c.6-.8 1.1-1.9.9-3-.9.1-2 .6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2-.5 2.8-1.3z" />
    </svg>
  );
}
