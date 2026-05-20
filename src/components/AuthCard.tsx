"use client";

import Link from "next/link";
import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Link href="/" className="text-lg font-semibold text-foreground hover:text-accent transition-colors">
            NewsMine
          </Link>
        </div>
        <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-lg">
          <h1 className="text-xl font-semibold text-foreground mb-1">{title}</h1>
          {subtitle && <p className="text-sm text-muted mb-5">{subtitle}</p>}
          {children}
        </div>
        {footer && <div className="mt-4 text-center text-sm text-muted">{footer}</div>}
      </div>
    </div>
  );
}
