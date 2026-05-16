/**
 * Client-side JWT storage and guest session bootstrap for chat API calls.
 */

import { apiBaseUrl } from "@/lib/env";

const ACCESS_KEY = "newspulse_access_token";
const REFRESH_KEY = "newspulse_refresh_token";
const GUEST_EMAIL_KEY = "newspulse_guest_email";
const GUEST_PASSWORD_KEY = "newspulse_guest_password";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

function randomPassword(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function registerGuest(): Promise<string> {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}`;
  const email = `guest-${id}@guest.newspulse.local`;
  const password = randomPassword();

  const res = await fetch(`${apiBaseUrl}/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      name: "Guest",
      password,
      password_confirm: password,
    }),
  });

  if (!res.ok) {
    throw new Error(`Could not create guest session (${res.status})`);
  }

  const data = await res.json();
  localStorage.setItem(GUEST_EMAIL_KEY, email);
  localStorage.setItem(GUEST_PASSWORD_KEY, password);
  setTokens(data.access, data.refresh);
  return data.access as string;
}

async function loginGuest(email: string, password: string): Promise<string> {
  const res = await fetch(`${apiBaseUrl}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(`Could not restore guest session (${res.status})`);
  }

  const data = await res.json();
  setTokens(data.access, data.refresh);
  return data.access as string;
}

/** Single in-flight bootstrap so concurrent callers share one guest session. */
let bootstrapPromise: Promise<string> | null = null;

async function bootstrapAccessToken(): Promise<string> {
  const cached = getAccessToken();
  if (cached) return cached;

  const email = localStorage.getItem(GUEST_EMAIL_KEY);
  const password = localStorage.getItem(GUEST_PASSWORD_KEY);
  if (email && password) {
    try {
      return await loginGuest(email, password);
    } catch {
      localStorage.removeItem(GUEST_EMAIL_KEY);
      localStorage.removeItem(GUEST_PASSWORD_KEY);
    }
  }

  return registerGuest();
}

/**
 * Returns a valid access token, creating or restoring a guest session if needed.
 * Concurrent callers await the same bootstrap (avoids duplicate guest registrations).
 */
export async function ensureAccessToken(): Promise<string> {
  const existing = getAccessToken();
  if (existing) return existing;

  if (!bootstrapPromise) {
    bootstrapPromise = bootstrapAccessToken().finally(() => {
      bootstrapPromise = null;
    });
  }

  return bootstrapPromise;
}

export function authHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}
