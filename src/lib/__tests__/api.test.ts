import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchFeed,
  fetchCluster,
  fetchRelatedClusters,
  fetchTabs,
  fetchArticles,
  fetchChatMessages,
  sendChatMessage,
  fetchChatQuota,
  fetchTracks,
  fetchTodayProgress,
  markClusterRead,
  toggleBookmark,
  fetchSearchResults,
  fetchSuggestions,
  fetchTrending,
  QuotaExceededError,
  RateLimitedError,
  SubscriptionExpiredError,
} from "@/lib/api";

const API_BASE = "http://127.0.0.1:8000/api";

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

function mockFetchMulti(...responses: { status: number; body: unknown }[]) {
  responses.forEach((r) => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      json: () => Promise.resolve(r.body),
      headers: new Headers(),
    } as Response);
  });
}

describe("fetchFeed", () => {
  it("fetches clusters with pagination params", async () => {
    const data = { count: 1, results: [{ id: 1, primary_title: "Test" }], next: null, previous: null };
    mockFetch(200, data);
    const result = await fetchFeed(1, 20);
    expect(result.count).toBe(1);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/clusters/?page=1&page_size=20&ordering=")
    );
  });

  it("throws on non-ok response", async () => {
    mockFetch(500, {});
    await expect(fetchFeed()).rejects.toThrow("API error: 500");
  });
});

describe("fetchCluster", () => {
  it("fetches a single cluster by id", async () => {
    const cluster = { id: 42, primary_title: "RBI Rate Hike" };
    mockFetch(200, cluster);
    const result = await fetchCluster(42);
    expect(result.primary_title).toBe("RBI Rate Hike");
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/clusters/42/"));
  });

  it("throws on 404", async () => {
    mockFetch(404, {});
    await expect(fetchCluster(999)).rejects.toThrow("API error: 404");
  });
});

describe("fetchRelatedClusters", () => {
  it("fetches related clusters with limit", async () => {
    mockFetch(200, [{ id: 2 }]);
    const result = await fetchRelatedClusters(1, 5);
    expect(result).toHaveLength(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/clusters/1/related/?limit=5"));
  });
});

describe("fetchTabs", () => {
  it("fetches tab list", async () => {
    mockFetch(200, [{ slug: "india", name: "India" }]);
    const tabs = await fetchTabs();
    expect(tabs[0].slug).toBe("india");
  });

  it("throws on error", async () => {
    mockFetch(503, {});
    await expect(fetchTabs()).rejects.toThrow("API error: 503");
  });
});

describe("fetchArticles", () => {
  it("fetches articles for a tab", async () => {
    mockFetch(200, { count: 1, results: [{ id: 1, title: "A" }], next: null, previous: null });
    const res = await fetchArticles("economy", 1, 20);
    expect(res.count).toBe(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("tab=economy"));
  });
});

describe("sendChatMessage", () => {
  it("sends a message and returns response", async () => {
    const body = { user_message: { id: 1 }, assistant_message: { id: 2 }, quota: { remaining: 9 } };
    mockFetch(200, body);
    const result = await sendChatMessage(42, "Explain this article");
    expect(result.assistant_message.id).toBe(2);
  });

  it("throws QuotaExceededError on 429 with quota body", async () => {
    const quota = { used: 10, limit: 10, remaining: 0 };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ code: "quota_exceeded", quota }),
      headers: new Headers(),
    } as Response);
    await expect(sendChatMessage(1, "hi")).rejects.toThrow(QuotaExceededError);
  });

  it("throws RateLimitedError on 429 without quota code", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: () => Promise.resolve({}),
      headers: new Headers(),
    } as Response);
    await expect(sendChatMessage(1, "hi")).rejects.toThrow(RateLimitedError);
  });

  it("throws SubscriptionExpiredError on 403 with subscription_expired code", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ code: "subscription_expired" }),
      headers: new Headers(),
    } as Response);
    await expect(sendChatMessage(1, "hi")).rejects.toThrow(SubscriptionExpiredError);
  });

  it("throws generic error for other status codes", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: "Bad request" }),
      headers: new Headers(),
    } as Response);
    await expect(sendChatMessage(1, "hi")).rejects.toThrow("Bad request");
  });
});

describe("fetchChatMessages", () => {
  it("fetches messages for a cluster", async () => {
    mockFetch(200, [{ id: 1, role: "user", content: "Hi", created_at: "" }]);
    const msgs = await fetchChatMessages(42);
    expect(msgs).toHaveLength(1);
    expect(msgs[0].content).toBe("Hi");
  });

  it("returns results array if wrapped in pagination", async () => {
    mockFetch(200, { results: [{ id: 1, role: "assistant", content: "Hello", created_at: "" }] });
    const msgs = await fetchChatMessages(1);
    expect(msgs).toHaveLength(1);
  });
});

describe("fetchChatQuota", () => {
  it("returns ai_chat quota when present", async () => {
    mockFetch(200, { ai_chat: { used: 3, limit: 10, remaining: 7 } });
    const q = await fetchChatQuota();
    expect(q?.remaining).toBe(7);
  });

  it("returns null on non-ok response", async () => {
    mockFetch(401, {});
    const q = await fetchChatQuota();
    expect(q).toBeNull();
  });

  it("returns null on fetch error", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("network"));
    const q = await fetchChatQuota();
    expect(q).toBeNull();
  });
});

describe("fetchTracks", () => {
  it("fetches exam track catalog", async () => {
    mockFetch(200, [{ slug: "upsc-cse", name: "UPSC CSE" }]);
    const tracks = await fetchTracks();
    expect(tracks[0].slug).toBe("upsc-cse");
  });
});

describe("fetchTodayProgress", () => {
  it("returns daily progress", async () => {
    const prog = { date: "2026-06-11", total_articles_today: 5, articles_read_count: 2, completion_percentage: 40, minutes_used: 10, minutes_target: 30, streak_count: 3 };
    mockFetch(200, prog);
    const result = await fetchTodayProgress();
    expect(result?.streak_count).toBe(3);
  });

  it("returns null on error", async () => {
    mockFetchMulti({ status: 401, body: {} }, { status: 401, body: {} });
    const result = await fetchTodayProgress();
    expect(result).toBeNull();
  });
});

describe("markClusterRead", () => {
  it("marks cluster read and returns progress", async () => {
    const resp = { is_read: true, progress: { articles_read_count: 1 } as any, streak_count: 1 };
    mockFetch(200, resp);
    const result = await markClusterRead(42);
    expect(result.is_read).toBe(true);
  });
});

describe("toggleBookmark", () => {
  it("returns the new bookmark state", async () => {
    mockFetch(200, { bookmarked: true });
    const state = await toggleBookmark(42);
    expect(state).toBe(true);
  });

  it("throws on error", async () => {
    mockFetch(400, { error: "bad" });
    await expect(toggleBookmark(42)).rejects.toThrow("bad");
  });
});

describe("fetchSearchResults", () => {
  it("fetches search with query and optional tab", async () => {
    mockFetch(200, { count: 0, results: [], next: null, previous: null });
    await fetchSearchResults("climate", "environment", 1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("q=climate"));
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("tab=environment"));
  });
});

describe("fetchSuggestions", () => {
  it("returns suggestions array", async () => {
    mockFetch(200, [{ text: "climate change", type: "keyword" }]);
    const s = await fetchSuggestions("clim");
    expect(s[0].text).toBe("climate change");
  });

  it("returns empty array on error", async () => {
    mockFetch(500, {});
    const s = await fetchSuggestions("x");
    expect(s).toEqual([]);
  });
});

describe("fetchTrending", () => {
  it("returns trending items", async () => {
    mockFetch(200, [{ text: "Economy", type: "tab" }]);
    const items = await fetchTrending();
    expect(items).toHaveLength(1);
  });

  it("returns empty array on error", async () => {
    mockFetch(500, {});
    const items = await fetchTrending();
    expect(items).toEqual([]);
  });
});
