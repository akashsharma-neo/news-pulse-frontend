"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

import { AuthProvider } from "@/contexts/AuthContext";
import { getFirebaseAnalytics } from "@/lib/firebase";

export default function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    void getFirebaseAnalytics();
  }, []);

  return <AuthProvider>{children}</AuthProvider>;
}
