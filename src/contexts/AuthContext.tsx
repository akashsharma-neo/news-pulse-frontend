"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AuthUser,
  completeOnboarding as apiCompleteOnboarding,
  exchangeFirebaseToken,
  fetchMe,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  resendVerification,
  verifyEmail,
  type TokenResponse,
} from "@/lib/auth-api";
import { clearTokens, isLoggedIn } from "@/lib/auth";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  /** True once signed in but no exam track has been chosen yet. */
  needsOnboarding: boolean;
  login: (email: string, password: string) => Promise<TokenResponse>;
  register: (payload: {
    email: string;
    password: string;
    password_confirm: string;
    name?: string;
  }) => Promise<{ detail: string; user: AuthUser }>;
  verifyEmailToken: (token: string) => Promise<TokenResponse>;
  resendVerificationEmail: (email: string) => Promise<void>;
  signInWithFirebaseIdToken: (idToken: string) => Promise<TokenResponse>;
  completeOnboarding: (payload: {
    exam_tracks?: string[];
    language?: string;
  }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    if (!isLoggedIn()) {
      setUser(null);
      return;
    }
    try {
      const me = await fetchMe();
      setUser(me);
    } catch {
      clearTokens();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      await refreshMe();
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin({ email, password });
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(
    async (payload: {
      email: string;
      password: string;
      password_confirm: string;
      name?: string;
    }) => apiRegister(payload),
    []
  );

  const verifyEmailToken = useCallback(async (token: string) => {
    const data = await verifyEmail(token);
    setUser(data.user);
    return data;
  }, []);

  const resendVerificationEmail = useCallback(async (email: string) => {
    await resendVerification(email);
  }, []);

  const signInWithFirebaseIdToken = useCallback(async (idToken: string) => {
    const data = await exchangeFirebaseToken(idToken);
    setUser(data.user);
    return data;
  }, []);

  const completeOnboarding = useCallback(
    async (payload: { exam_tracks?: string[]; language?: string }) => {
      const updated = await apiCompleteOnboarding(payload);
      setUser(updated);
      return updated;
    },
    []
  );

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user && isLoggedIn(),
      isEmailVerified: user?.email_verified ?? false,
      needsOnboarding: !!user && (user.exam_tracks?.length ?? 0) === 0,
      login,
      register,
      verifyEmailToken,
      resendVerificationEmail,
      signInWithFirebaseIdToken,
      completeOnboarding,
      logout,
      refreshMe,
    }),
    [
      user,
      loading,
      login,
      register,
      verifyEmailToken,
      resendVerificationEmail,
      signInWithFirebaseIdToken,
      completeOnboarding,
      logout,
      refreshMe,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
