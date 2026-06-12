"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import FullScreenSpinner from "@/components/FullScreenSpinner";

export default function OnboardingPage() {
  const { loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace("/login");
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) return <FullScreenSpinner />;
  return <OnboardingFlow />;
}
