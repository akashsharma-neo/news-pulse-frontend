import { apiBaseUrl } from "@/lib/env";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "@/lib/auth";

const API_BASE = apiBaseUrl;

export interface AuthUser {
  email: string;
  phone: string | null;
  name: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  date_joined?: string;
  monthly_ai_chat_used?: number;
  monthly_ai_chat_limit?: number;
  monthly_ai_chat_remaining?: number;
}

export interface TokenResponse {
  access: string;
  refresh: string;
  user: AuthUser;
}

export class AuthApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
    this.code = code;
  }
}

async function parseError(res: Response): Promise<AuthApiError> {
  let message = `Request failed (${res.status})`;
  let code: string | undefined;
  try {
    const data = await res.json();
    if (typeof data.detail === "string") message = data.detail;
    else if (typeof data.error === "string") message = data.error;
    else if (Array.isArray(data.non_field_errors)) message = data.non_field_errors[0];
    else if (typeof data.email === "object" && data.email?.[0]) message = data.email[0];
    if (typeof data.code === "string") code = data.code;
  } catch {
    // ignore
  }
  return new AuthApiError(message, res.status, code);
}

export async function register(payload: {
  email: string;
  password: string;
  password_confirm: string;
  name?: string;
  phone?: string;
}): Promise<{ detail: string; user: AuthUser }> {
  const res = await fetch(`${API_BASE}/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function login(payload: {
  email?: string;
  phone?: string;
  password: string;
}): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await parseError(res);
  const data: TokenResponse = await res.json();
  setTokens(data.access, data.refresh);
  return data;
}

export async function verifyEmail(token: string): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE}/auth/verify-email/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) throw await parseError(res);
  const data: TokenResponse = await res.json();
  setTokens(data.access, data.refresh);
  return data;
}

export async function resendVerification(email: string): Promise<{ detail: string }> {
  const res = await fetch(`${API_BASE}/auth/resend-verification/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function exchangeFirebaseToken(idToken: string): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE}/auth/firebase/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token: idToken }),
  });
  if (!res.ok) throw await parseError(res);
  const data: TokenResponse = await res.json();
  setTokens(data.access, data.refresh);
  return data;
}

export async function refreshTokens(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  const res = await fetch(`${API_BASE}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) {
    clearTokens();
    return null;
  }
  const data = await res.json();
  if (data.access) {
    setTokens(data.access, data.refresh ?? refresh);
    return data.access as string;
  }
  return null;
}

export async function logout(): Promise<void> {
  const refresh = getRefreshToken();
  if (refresh) {
    await fetch(`${API_BASE}/auth/logout/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    }).catch(() => undefined);
  }
  clearTokens();
}

export async function fetchMe(accessToken?: string): Promise<AuthUser | null> {
  const token = accessToken ?? getAccessToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}/auth/me/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) return null;
  if (!res.ok) throw await parseError(res);
  return res.json();
}

/** Return a valid access token, refreshing from refresh token if access is missing. */
export async function getValidAccessToken(): Promise<string | null> {
  const existing = getAccessToken();
  if (existing) return existing;
  return refreshTokens();
}
