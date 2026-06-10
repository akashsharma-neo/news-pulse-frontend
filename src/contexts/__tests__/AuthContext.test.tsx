import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

vi.mock("@/lib/auth-api", () => ({
  login: vi.fn(),
  register: vi.fn(),
  verifyEmail: vi.fn(),
  resendVerification: vi.fn(),
  exchangeFirebaseToken: vi.fn(),
  completeOnboarding: vi.fn(),
  logout: vi.fn(),
  fetchMe: vi.fn(),
  refreshTokens: vi.fn(),
  getValidAccessToken: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  clearTokens: vi.fn(),
  isLoggedIn: vi.fn(() => false),
  getAccessToken: vi.fn(() => null),
  setTokens: vi.fn(),
}));

import * as authApi from "@/lib/auth-api";
import * as auth from "@/lib/auth";

function TestConsumer() {
  const ctx = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(ctx.loading)}</span>
      <span data-testid="authenticated">{String(ctx.isAuthenticated)}</span>
      <span data-testid="needs-onboarding">{String(ctx.needsOnboarding)}</span>
      <span data-testid="email-verified">{String(ctx.isEmailVerified)}</span>
      {ctx.user && <span data-testid="user-email">{ctx.user.email}</span>}
      <button data-testid="btn-login" onClick={() => ctx.login("a@b.com", "pw")}>
        Login
      </button>
      <button data-testid="btn-refresh" onClick={() => ctx.refreshMe()}>
        Refresh
      </button>
      <button data-testid="btn-logout" onClick={() => ctx.logout()}>
        Logout
      </button>
      <button
        data-testid="btn-firebase"
        onClick={() => ctx.signInWithFirebaseIdToken("fire-tok")}
      >
        Firebase
      </button>
      <button
        data-testid="btn-onboarding"
        onClick={() => ctx.completeOnboarding({ exam_tracks: ["upsc-cse"], language: "en" })}
      >
        Onboarding
      </button>
      <button
        data-testid="btn-verify-email"
        onClick={() => ctx.verifyEmailToken("email-tok")}
      >
        Verify
      </button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  vi.mocked(auth.isLoggedIn).mockReturnValue(false);
  vi.mocked(authApi.fetchMe).mockResolvedValue(null);
});

describe("AuthContext", () => {
  it("shows loading initially, then becomes ready", async () => {
    renderWithProvider();
    expect(screen.getByTestId("loading").textContent).toBe("true");
    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });
  });

  it("loads user on mount if logged in", async () => {
    vi.mocked(auth.isLoggedIn).mockReturnValue(true);
    vi.mocked(authApi.fetchMe).mockResolvedValue({
      email: "a@b.com",
      name: "Alice",
      exam_tracks: ["upsc-cse"],
    } as any);
    renderWithProvider();
    await waitFor(() => {
      expect(screen.getByTestId("user-email").textContent).toBe("a@b.com");
    });
  });

  it("sets isAuthenticated when user is logged in", async () => {
    vi.mocked(auth.isLoggedIn).mockReturnValue(true);
    vi.mocked(authApi.fetchMe).mockResolvedValue({ email: "a@b.com" } as any);
    renderWithProvider();
    await waitFor(() => {
      expect(screen.getByTestId("authenticated").textContent).toBe("true");
    });
  });

  it("needsOnboarding is true when user has no exam_tracks", async () => {
    vi.mocked(auth.isLoggedIn).mockReturnValue(true);
    vi.mocked(authApi.fetchMe).mockResolvedValue({ email: "a@b.com", exam_tracks: [] } as any);
    renderWithProvider();
    await waitFor(() => {
      expect(screen.getByTestId("needs-onboarding").textContent).toBe("true");
    });
  });

  it("needsOnboarding is false when user has exam_tracks", async () => {
    vi.mocked(auth.isLoggedIn).mockReturnValue(true);
    vi.mocked(authApi.fetchMe).mockResolvedValue({
      email: "a@b.com",
      exam_tracks: ["upsc-cse"],
    } as any);
    renderWithProvider();
    await waitFor(() => {
      expect(screen.getByTestId("needs-onboarding").textContent).toBe("false");
    });
  });

  it("login sets the user", async () => {
    vi.mocked(auth.isLoggedIn).mockReturnValue(false);
    vi.mocked(authApi.login).mockResolvedValue({
      access: "a",
      refresh: "r",
      user: { email: "a@b.com", name: "Alice" } as any,
    });
    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    await userEvent.click(screen.getByTestId("btn-login"));
    await waitFor(() => {
      expect(screen.getByTestId("user-email").textContent).toBe("a@b.com");
    });
  });

  it("firebase signin sets the user", async () => {
    vi.mocked(auth.isLoggedIn).mockReturnValue(false);
    vi.mocked(authApi.exchangeFirebaseToken).mockResolvedValue({
      access: "a",
      refresh: "r",
      user: { email: "fire@user.com" } as any,
    });
    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    await userEvent.click(screen.getByTestId("btn-firebase"));
    await waitFor(() => {
      expect(screen.getByTestId("user-email").textContent).toBe("fire@user.com");
    });
  });

  it("logout clears the user", async () => {
    vi.mocked(auth.isLoggedIn).mockReturnValue(true);
    vi.mocked(authApi.fetchMe).mockResolvedValue({ email: "a@b.com" } as any);
    renderWithProvider();
    await waitFor(() => {
      expect(screen.getByTestId("user-email").textContent).toBe("a@b.com");
    });

    await userEvent.click(screen.getByTestId("btn-logout"));
    await waitFor(() => {
      expect(screen.queryByTestId("user-email")).not.toBeInTheDocument();
    });
  });

  it("completeOnboarding updates the user", async () => {
    vi.mocked(auth.isLoggedIn).mockReturnValue(true);
    vi.mocked(authApi.fetchMe).mockResolvedValue({ email: "a@b.com", exam_tracks: [] } as any);
    vi.mocked(authApi.completeOnboarding).mockResolvedValue({
      email: "a@b.com",
      exam_tracks: ["upsc-cse"],
      language: "en",
    } as any);
    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    await userEvent.click(screen.getByTestId("btn-onboarding"));
    await waitFor(() => {
      expect(screen.getByTestId("needs-onboarding").textContent).toBe("false");
    });
  });

  it("verifyEmailToken sets the user", async () => {
    vi.mocked(authApi.verifyEmail).mockResolvedValue({
      access: "a",
      refresh: "r",
      user: { email: "a@b.com", email_verified: true } as any,
    });
    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    await userEvent.click(screen.getByTestId("btn-verify-email"));
    await waitFor(() => {
      expect(screen.getByTestId("email-verified").textContent).toBe("true");
    });
  });

  it("refreshMe handles fetch failure gracefully", async () => {
    vi.mocked(auth.isLoggedIn).mockReturnValue(true);
    vi.mocked(authApi.fetchMe).mockResolvedValue({ email: "a@b.com" } as any);
    renderWithProvider();
    await waitFor(() => {
      expect(screen.getByTestId("user-email").textContent).toBe("a@b.com");
    });

    vi.mocked(authApi.fetchMe).mockRejectedValueOnce(new Error("fail"));
    await userEvent.click(screen.getByTestId("btn-refresh"));
    await waitFor(() => {
      expect(screen.queryByTestId("user-email")).not.toBeInTheDocument();
    });
  });
});
