"use client";

import Link from "next/link";
import BottomNav from "./nav/BottomNav";

export default function ComingSoon({
  active,
  icon,
  title,
  blurb,
}: {
  active: "duel" | "upgrade";
  icon: string;
  title: string;
  blurb: string;
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 pb-24 text-center">
      <span className="mb-4 text-4xl" aria-hidden>
        {icon}
      </span>
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      <p className="mt-2 max-w-xs text-[14px] leading-relaxed text-muted">{blurb}</p>
      <span className="label-caps mt-5 rounded-full border border-accent/40 px-3 py-1 text-[10px] text-accent">
        Coming soon
      </span>
      <Link
        href="/"
        className="mt-8 text-[13px] text-muted underline-offset-4 hover:text-foreground hover:underline"
      >
        Back to today&apos;s feed
      </Link>
      <BottomNav active={active} />
    </div>
  );
}
