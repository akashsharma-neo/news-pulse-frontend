import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  register,
  login,
  verifyEmail,
  resendVerification,
  exchangeFirebaseToken,
  completeOnboarding,
  refreshTokens,
  logout,
  fetchMe,
  AuthApiError,
} from "@/lib/auth-api";

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
});

function mockFetch(status: number, body: unknown) {
  return vi.mocked(fetch).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    headers: new Headers(),
  } as Response);
}

describe("register", () => {
  it("registers a new user", async () => {
    const resp = { detail: "Check your email", user: { email: "a@b.com", name: "A" } as any };
    mockFetch(201, resp);
    const result = await register({ email: "a@b.com", password: "123456", password_confirm: "123456" });
    expect(result.detail).toBe("Check your email");
  });

  it("throws AuthApiError on failure", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ email: ["Email already exists"] }),
      headers: new Headers(),
    } as Response);
    await expect(register({ email: "x@x.com", password: "123456", password_confirm: "123456" })).rejects.toThrow(AuthApiError);
  });
});

describe("login", () => {
  it("stores tokens and returns user", async () => {
    const resp = { access: "a1", refresh: "r1", user: { email: "a@b.com" } as any };
    mockFetch(200, resp);
    const result = await login({ email: "a@b.com", password: "x" });
    expect(result.access).toBe("a1");
    expect(localStorage.getItem("newsmine_access_token")).toBe("a1");
  });
});

describe("verifyEmail", () => {
  it("stores tokens and returns them", async () => {
    mockFetch(200, { access: "a2", refresh: "r2", user: { email: "a@b.com", email_verified: true } as any });
    const result = await verifyEmail("tok123");
    expect(result.access).toBe("a2");
    expect(localStorage.getItem("newsmine_access_token")).toBe("a2");
  });
});

describe("exchangeFirebaseToken", () => {
  it("exchanges Firebase idToken and stores tokens", async () => {
    const resp = { access: "a3", refresh: "r3", user: { email: "firebase@user.com" } as any };
    mockFetch(200, resp);
    const result = await exchangeFirebaseToken("firebase-id-token");
    expect(result.access).toBe("a3");
    expect(localStorage.getItem("newsmine_access_token")).toBe("a3");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/firebase/"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("firebase-id-token"),
      })
    );
  });
});

describe("completeOnboarding", () => {
  it("patches exam_tracks and language", async () => {
    const updated = { email: "a@b.com", exam_tracks: ["upsc-cse"], language: "en" } as any;
    mockFetch(200, updated);
    const result = await completeOnboarding({ exam_tracks: ["upsc-cse"], language: "en" });
    expect(result.exam_tracks).toEqual(["upsc-cse"]);
  });
});

describe("refreshTokens", () => {
  it("returns null without a stored refresh token", async () => {
    const result = await refreshTokens();
    expect(result).toBeNull();
  });

  it("refreshes using stored refresh token", async () => {
    localStorage.setItem("newsmine_refresh_token", "old-refresh");
    mockFetch(200, { access: "new-access", refresh: "new-refresh" });
    const token = await refreshTokens();
    expect(token).toBe("new-access");
    expect(localStorage.getItem("newsmine_access_token")).toBe("new-access");
  });

  it("clears tokens and returns null on failure", async () => {
    localStorage.setItem("newsmine_access_token", "stale");
    localStorage.setItem("newsmine_refresh_token", "stale-refresh");
    mockFetch(401, {});
    const token = await refreshTokens();
    expect(token).toBeNull();
    expect(localStorage.getItem("newsmine_access_token")).toBeNull();
  });
});

describe("logout", () => {
  it("calls backend and clears tokens", async () => {
    localStorage.setItem("newsmine_refresh_token", "r");
    mockFetch(200, {});
    await logout();
    expect(localStorage.getItem("newsmine_refresh_token")).toBeNull();
  });

  it("clears tokens even if backend call fails", async () => {
    localStorage.setItem("newsmine_refresh_token", "r");
    vi.mocked(fetch).mockRejectedValueOnce(new Error("network"));
    await logout();
    expect(localStorage.getItem("newsmine_refresh_token")).toBeNull();
  });
});

describe("fetchMe", () => {
  it("returns null without a token", async () => {
    const result = await fetchMe();
    expect(result).toBeNull();
  });

  it("fetches current user profile", async () => {
    localStorage.setItem("newsmine_access_token", "tok");
    mockFetch(200, { email: "a@b.com" });
    const user = await fetchMe();
    expect(user?.email).toBe("a@b.com");
  });

  it("returns null on 401", async () => {
    localStorage.setItem("newsmine_access_token", "stale");
    mockFetch(401, {});
    const user = await fetchMe();
    expect(user).toBeNull();
  });
});
