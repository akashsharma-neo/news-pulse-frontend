"use client";

import Link from "next/link";
import NexLogo from "../brand/NexLogo";

const STATS = [
  { value: "10K+", label: "Aspirants" },
  { value: "36 pts", label: "Avg jump" },
  { value: "4.8★", label: "Rating" },
];

const FEATURES = [
  { icon: "✦", color: "var(--accent-ai)", text: "AI Guide explains every article" },
  { icon: "⚡", color: "var(--accent)", text: "Syllabus-mapped to your exact exam" },
  { icon: "🛡", color: "var(--success)", text: "RBI-compliant UPI AutoPay" },
];

export default function LandingScreen() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-10 pt-12">
      <div className="mb-10 flex items-center gap-2">
        <NexLogo className="h-9 w-9" />
        <span className="font-display text-xl font-bold">NexPrep</span>
      </div>

      <span className="mb-6 w-fit rounded-full border border-accent-ai/40 px-3 py-1 label-caps text-[10px] text-accent-ai">
        AI-First Exam Intelligence
      </span>

      <h1 className="font-display text-4xl font-bold leading-tight">
        Master Current Affairs in{" "}
        <span className="text-accent">30 Minutes</span> a Day
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-muted">
        Syllabus-mapped briefs. AI-guided context. No more PDF overload or
        newspaper bottlenecks.
      </p>

      <div className="mt-7 grid grid-cols-3 gap-3">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border-subtle bg-surface px-2 py-3 text-center"
          >
            <div className="font-mono text-base text-accent">{s.value}</div>
            <div className="label-caps mt-1 text-[9px] text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {FEATURES.map((f) => (
          <div
            key={f.text}
            className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface px-4 py-3.5"
          >
            <span style={{ color: f.color }} aria-hidden>
              {f.icon}
            </span>
            <span className="text-[14px] text-foreground">{f.text}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-10">
        <Link
          href="/login"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 font-display text-base font-semibold text-[#0d0e14] transition-opacity hover:opacity-90"
        >
          Get Started — It&apos;s Free
          <span aria-hidden>›</span>
        </Link>
        <p className="mt-3 text-center text-[12px] text-muted">
          7-day free trial · No card required
        </p>
      </div>
    </div>
  );
}
