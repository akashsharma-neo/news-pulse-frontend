/**
 * Frontend environment configuration.
 *
 * NEXT_PUBLIC_* vars are inlined at build time. For local dev, use .env.local
 * (see config/env.dev.example).
 */

export const newsMineEnv =
  process.env.NEXT_PUBLIC_NEWSMINE_ENV?.trim().toLowerCase() || "dev";

export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8000/api";
