"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = "feed" | "duel" | "settings";

const TABS: { id: Tab; label: string; href: string; icon: React.ReactNode }[] = [
  {
    id: "feed",
    label: "Feed",
    href: "/",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden>
        <rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "duel",
    label: "Daily Duel",
    href: "/duel",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden>
        <path
          d="M5 5l9 9m0 0l3 3m-3-3l-2 2m9-11l-9 9m0 0l-3 3m3-3l2 2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Account",
    href: "/settings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden>
        <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function BottomNav({ active }: { active?: Tab }) {
  const pathname = usePathname();
  const current: Tab =
    active ??
    (pathname.startsWith("/settings")
      ? "settings"
      : pathname.startsWith("/duel")
        ? "duel"
        : "feed");

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border-subtle bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-around px-4 py-2.5">
        {TABS.map((tab) => {
          const isActive = tab.id === current;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${
                isActive ? "text-accent" : "text-muted hover:text-foreground"
              }`}
            >
              {tab.icon}
              <span className="label-caps text-[10px]">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
