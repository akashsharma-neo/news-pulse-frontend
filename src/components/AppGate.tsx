"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LandingScreen from "./landing/LandingScreen";
import DashboardFeed from "./feed/DashboardFeed";
import FullScreenSpinner from "./FullScreenSpinner";

/**
 * Root routing gate for "/":
 *   loading           → spinner
 *   not authenticated → landing
 *   no track chosen   → onboarding
 *   otherwise         → dashboard feed
 */
export default function AppGate() {
  const { loading, isAuthenticated, needsOnboarding, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated && needsOnboarding) {
      router.replace("/onboarding");
    }
  }, [loading, isAuthenticated, needsOnboarding, router]);

  useEffect(() => {
    if (!loading && isAuthenticated && !needsOnboarding && user?.access_state === "expired") {
      router.replace("/upgrade");
    }
  }, [loading, isAuthenticated, needsOnboarding, user?.access_state, router]);

  if (loading) return <FullScreenSpinner />;
  if (!isAuthenticated) return <LandingScreen />;
  if (needsOnboarding) return <FullScreenSpinner />;
  if (user?.access_state === "expired") return <FullScreenSpinner />;
  return <DashboardFeed />;
}
