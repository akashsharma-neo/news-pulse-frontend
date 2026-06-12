"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import FullScreenSpinner from "@/components/FullScreenSpinner";

/** Legacy URL — subscription lives under Settings. */
export default function UpgradePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings#subscription");
  }, [router]);

  return <FullScreenSpinner />;
}
