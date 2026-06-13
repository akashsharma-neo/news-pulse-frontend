"use client";

import Link from "next/link";
import BottomNav from "./nav/BottomNav";
import RecallPanel from "./feed/RecallPanel";

export default function ComingSoon({
  active,
  title,
}: {
  active: "feed";
  title: string;
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 pb-24 text-center">
      <RecallPanel />
      <h1 className="sr-only">{title}</h1>
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
