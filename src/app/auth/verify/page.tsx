"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthCard from "@/components/AuthCard";
import { useAuth } from "@/contexts/AuthContext";

function VerifyWithToken({ token }: { token: string }) {
  const router = useRouter();
  const { verifyEmailToken } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email…");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await verifyEmailToken(token);
        if (!active) return;
        setStatus("success");
        setMessage("Email verified. Redirecting…");
        setTimeout(() => router.replace("/"), 1500);
      } catch (err) {
        if (!active) return;
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Verification failed.");
      }
    })();
    return () => {
      active = false;
    };
  }, [token, verifyEmailToken, router]);

  return (
    <AuthCard title="Email verification">
      <p
        className={`text-sm text-center ${
          status === "error" ? "text-red-400" : status === "success" ? "text-accent" : "text-muted"
        }`}
      >
        {message}
      </p>
      {status === "error" && (
        <div className="mt-4 text-center">
          <Link href="/auth/check-email" className="text-sm text-accent hover:underline">
            Resend verification email
          </Link>
        </div>
      )}
    </AuthCard>
  );
}

function VerifyContent() {
  const params = useSearchParams();
  const token = params.get("token");

  if (!token) {
    return (
      <AuthCard title="Email verification">
        <p className="text-sm text-red-400 text-center">Missing verification token.</p>
        <div className="mt-4 text-center">
          <Link href="/auth/check-email" className="text-sm text-accent hover:underline">
            Resend verification email
          </Link>
        </div>
      </AuthCard>
    );
  }

  return <VerifyWithToken token={token} />;
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthCard title="Email verification">
          <p className="text-sm text-muted text-center">Loading…</p>
        </AuthCard>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
