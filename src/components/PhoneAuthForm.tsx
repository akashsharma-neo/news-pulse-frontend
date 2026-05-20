"use client";

import { useEffect, useRef, useState } from "react";
import {
  ConfirmationResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { useAuth } from "@/contexts/AuthContext";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function PhoneAuthForm() {
  const { signInWithFirebaseIdToken } = useAuth();
  const router = useRouter();
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      verifierRef.current?.clear();
      verifierRef.current = null;
    };
  }, []);

  if (!isFirebaseConfigured()) {
    return (
      <p className="text-sm text-muted text-center py-2">
        Phone sign-in is not configured. Add Firebase env vars to enable it.
      </p>
    );
  }

  async function getVerifier(): Promise<RecaptchaVerifier> {
    const auth = getFirebaseAuth();
    if (!auth || !recaptchaRef.current) {
      throw new Error("Firebase is not ready.");
    }
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
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      if (!auth) throw new Error("Firebase is not configured.");
      const normalized = phone.trim().startsWith("+") ? phone.trim() : `+${phone.trim()}`;
      const verifier = await getVerifier();
      confirmationRef.current = await signInWithPhoneNumber(auth, normalized, verifier);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send verification code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const confirmation = confirmationRef.current;
      if (!confirmation) throw new Error("Request a code first.");
      const credential = await confirmation.confirm(code.trim());
      const idToken = await credential.user.getIdToken();
      await signInWithFirebaseIdToken(idToken);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "code") {
    return (
      <form onSubmit={handleVerifyCode} className="space-y-3">
        <p className="text-sm text-muted">Enter the code sent to {phone}</p>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-foreground placeholder:text-muted text-sm"
          required
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-full bg-accent text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? "Verifying…" : "Verify & sign in"}
        </button>
        <button
          type="button"
          onClick={() => {
            setStep("phone");
            setCode("");
            setError(null);
          }}
          className="w-full text-sm text-muted hover:text-foreground"
        >
          Use a different number
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendCode} className="space-y-3">
      <input
        type="tel"
        placeholder="+91 98765 43210"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-foreground placeholder:text-muted text-sm"
        required
      />
      <div ref={recaptchaRef} id="recaptcha-container" />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-full bg-surface-elevated border border-border-subtle text-foreground text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Sending…" : "Send verification code"}
      </button>
    </form>
  );
}
