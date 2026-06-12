"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AuthScreen from "@/components/auth/AuthScreen";
import FullScreenSpinner from "@/components/FullScreenSpinner";

export default function LoginPage() {
  const { loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) router.replace("/");
  }, [loading, isAuthenticated, router]);

  if (loading || isAuthenticated) return <FullScreenSpinner />;
  return <AuthScreen />;
}
