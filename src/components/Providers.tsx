"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { getFirebaseAnalytics } from "@/lib/firebase";

export default function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    void getFirebaseAnalytics();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
