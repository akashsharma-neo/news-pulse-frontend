import type { NextConfig } from "next";

const isDev =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_NEWSMINE_ENV?.trim().toLowerCase() === "dev";

/** Hostnames/IPs for phone/LAN `next dev` HMR only — never applied in production builds. */
const allowedDevOrigins = isDev
  ? (process.env.ALLOWED_DEV_ORIGINS ?? "")
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean)
  : [];

const nextConfig: NextConfig = {
  output: "standalone",
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
};

export default nextConfig;
