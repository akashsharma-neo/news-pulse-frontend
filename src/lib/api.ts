import { apiBaseUrl } from "@/lib/env";
import { getValidAccessToken, refreshTokens } from "@/lib/auth-api";
import { clearTokens } from "@/lib/auth";
import { getDeviceId } from "@/lib/device";

const API_BASE = apiBaseUrl;

export interface Tab {
  id: number;
  name: string;
  slug: string;
  order: number;
}

export interface ExamAngleRow {
  label: string;
  text: string;
}

export interface PYQ {
  year: number;
  exam: string;
  question: string;
  answer?: string;
}

export interface TopicCluster {
  id: number;
  topic_id: string;
  primary_title: string;
  primary_url: string;
  source_name: string;
  category_slug: string;
  published_at: string;
  summary: string;
  source_names: string[];
  image_url: string;
  suggested_prompts?: string[];
  // NexPrep article anatomy (PRD §2) — empty for unenriched clusters.
  gs_paper_tag?: string;
  exam_tags?: string[];
  exam_targets?: string[];
  why_in_news?: string;
  key_facts?: string[];
  static_anchors?: string[];
  exam_angle?: ExamAngleRow[];
  trend_context?: string;
  pyqs?: PYQ[];
  reading_minutes?: number;
  language?: string;
  created_at: string;
}

export interface ExamTrack {
  slug: string;
  name: string;
  subtitle: string;
  color: string;
  active: boolean;
}

export interface DailyProgress {
  date: string;
  total_articles_today: number;
  articles_read_count: number;
  completion_percentage: number;
  minutes_used: number;
  minutes_target: number;
  streak_count: number;
}

export interface Article {
  id: number;
  title: string;
  url: string;
  source_name: string;
  category_slug: string;
  published_at: string;
  summary: string;
  source_image_url: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface SendChatMessageResponse {
  user_message: ChatMessage;
  assistant_message: ChatMessage;
  quota: ChatQuota;
}

export interface ChatQuota {
  used: number;
  limit: number;
  remaining: number;
  resets_at: string;
}

export class QuotaExceededError extends Error {
  quota: ChatQuota;

  constructor(quota: ChatQuota) {
    super("Daily AI Guide limit reached.");
    this.name = "QuotaExceededError";
    this.quota = quota;
  }
}

export class SubscriptionExpiredError extends Error {
  constructor() {
    super("Your trial has ended. Upgrade to keep using the AI Guide.");
    this.name = "SubscriptionExpiredError";
  }
}

export interface SearchResult {
  id: number;
  cluster_id: number;
  title: string;
  url: string;
  source_name: string;
  category_slug: string;
  published_at: string;
  summary: string;
  source_image_url: string;
  headline: string;
}

export interface Suggestion {
  text: string;
  type: "keyword" | "title";
}

export interface TrendingItem {
  text: string;
  type: "tab" | "cluster";
  slug?: string;
  cluster_id?: number;
}

export class RateLimitedError extends Error {
  constructor() {
    super("Too many requests. Please slow down.");
    this.name = "RateLimitedError";
  }
}

/**
 * Build headers common to all authenticated/identified requests.
 * Sends JWT if logged in, always sends X-Device-ID for anonymous tracking.
 */
async function buildHeaders(): Promise<HeadersInit> {
  const token = await getValidAccessToken();
  const deviceId = await getDeviceId();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Device-ID": deviceId,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function mergeFetchInit(headers: HeadersInit, init?: RequestInit): RequestInit {
  return {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string>) },
  };
}

/**
 * Fetch with JWT + X-Device-ID. On 401, refresh once; if still unauthorized, clear
 * stale tokens and retry anonymously (chat/quota are AllowAny with device id).
 */
async function fetchWithAuth(url: string, init?: RequestInit): Promise<Response> {
  let res = await fetch(url, mergeFetchInit(await buildHeaders(), init));
  if (res.status !== 401) return res;

  const newToken = await refreshTokens();
  if (newToken) {
    res = await fetch(url, mergeFetchInit(await buildHeaders(), init));
    if (res.status !== 401) return res;
  }

  clearTokens();
  res = await fetch(url, mergeFetchInit(await buildHeaders(), init));
  return res;
}

async function parseApiError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (data && typeof data.error === "string") return data.error;
    if (typeof data.detail === "string") return data.detail;
  } catch {
    // ignore JSON parse errors
  }
  return `API error: ${res.status}`;
}

/**
 * Fetch clusters for a specific tab, with pagination.
 */
export async function fetchClusters(
  tab: string,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<TopicCluster>> {
  const params = new URLSearchParams({
    tab,
    page: String(page),
    page_size: String(pageSize),
    ordering: "-primary_article__published_at",
  });
  const res = await fetch(`${API_BASE}/clusters/?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/**
 * Fetch the NexPrep daily feed — newest approved clusters across all tracks.
 * Track filtering is applied client-side from `exam_targets` for v1.
 */
export async function fetchFeed(
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<TopicCluster>> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
    ordering: "-primary_article__published_at",
  });
  const res = await fetch(`${API_BASE}/clusters/?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/**
 * Fetch a single cluster by ID.
 */
export async function fetchCluster(id: number): Promise<TopicCluster> {
  const res = await fetch(`${API_BASE}/clusters/${id}/`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/**
 * Fetch related clusters for the detail page (same tab, excludes current).
 */
export async function fetchRelatedClusters(
  id: number,
  limit: number = 8
): Promise<TopicCluster[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  const res = await fetch(`${API_BASE}/clusters/${id}/related/?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/**
 * Fetch all available tabs.
 */
export async function fetchTabs(): Promise<Tab[]> {
  const res = await fetch(`${API_BASE}/clusters/tabs/`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/**
 * Fetch articles for a specific tab.
 */
export async function fetchArticles(
  tab: string,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<Article>> {
  const params = new URLSearchParams({ tab, page: String(page), page_size: String(pageSize) });
  const res = await fetch(`${API_BASE}/articles/?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/**
 * Fetch chat messages for a cluster thread.
 * clusterId is the numeric TopicCluster PK.
 */
export async function fetchChatMessages(clusterId: number): Promise<ChatMessage[]> {
  const params = new URLSearchParams({ cluster_id: String(clusterId) });
  const res = await fetchWithAuth(`${API_BASE}/messages/?${params}`);
  if (!res.ok) throw new Error(await parseApiError(res));
  const data = await res.json();
  return Array.isArray(data) ? data : data.results ?? [];
}

/**
 * Send a user message and receive the assistant reply from OpenRouter.
 * clusterId is the numeric TopicCluster PK.
 */
export async function sendChatMessage(
  clusterId: number,
  content: string
): Promise<SendChatMessageResponse> {
  const res = await fetchWithAuth(`${API_BASE}/messages/send/`, {
    method: "POST",
    body: JSON.stringify({ cluster_id: clusterId, content }),
  });

  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    if (body.code === "quota_exceeded" && body.quota) {
      throw new QuotaExceededError(body.quota);
    }
    throw new RateLimitedError();
  }

  if (res.status === 403) {
    const body = await res.json().catch(() => ({}));
    if (body.code === "subscription_expired") {
      throw new SubscriptionExpiredError();
    }
  }

  if (!res.ok) throw new Error(await parseApiError(res));
  return res.json();
}

/**
 * Fetch current AI chat quota.
 */
export async function fetchChatQuota(): Promise<ChatQuota | null> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/quota/`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.ai_chat ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// NexPrep — exam tracks, reading progress, bookmarks
// ---------------------------------------------------------------------------

/** Exam-track catalog (onboarding picker + Syllabus Tracks chips). */
export async function fetchTracks(): Promise<ExamTrack[]> {
  const res = await fetch(`${API_BASE}/tracks/`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/** Today's reading progress + streak (minutes ring + N/M read bar). */
export async function fetchTodayProgress(): Promise<DailyProgress | null> {
  const res = await fetchWithAuth(`${API_BASE}/progress/today/`);
  if (!res.ok) return null;
  return res.json();
}

export interface MarkReadResponse {
  is_read: boolean;
  progress: DailyProgress;
  streak_count: number;
}

/** Mark a story read (swipe-right or finishing the detail view); idempotent. */
export async function markClusterRead(clusterId: number): Promise<MarkReadResponse> {
  const res = await fetchWithAuth(`${API_BASE}/progress/read/`, {
    method: "POST",
    body: JSON.stringify({ cluster_id: clusterId }),
  });
  if (!res.ok) throw new Error(await parseApiError(res));
  return res.json();
}

/** Toggle bookmark on a story. Returns the new state. */
export async function toggleBookmark(clusterId: number): Promise<boolean> {
  const res = await fetchWithAuth(`${API_BASE}/progress/bookmark/`, {
    method: "POST",
    body: JSON.stringify({ cluster_id: clusterId }),
  });
  if (!res.ok) throw new Error(await parseApiError(res));
  const data = await res.json();
  return data.bookmarked;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/**
 * Full-text search across articles.
 * GET /api/search/?q=<query>&tab=<slug>&page=1
 */
export async function fetchSearchResults(
  query: string,
  tab?: string,
  page: number = 1
): Promise<PaginatedResponse<SearchResult>> {
  const params = new URLSearchParams({ q: query, page: String(page) });
  if (tab) params.set("tab", tab);
  const res = await fetch(`${API_BASE}/search/?${params}`);
  if (!res.ok) throw new Error(`Search error: ${res.status}`);
  return res.json();
}

/**
 * Autocomplete suggestions for the search bar.
 * GET /api/search/suggestions/?q=<query>
 */
export async function fetchSuggestions(query: string): Promise<Suggestion[]> {
  const params = new URLSearchParams({ q: query });
  const res = await fetch(`${API_BASE}/search/suggestions/?${params}`);
  if (!res.ok) return [];
  return res.json();
}

/**
 * Trending topics — tab suggestions + popular clusters.
 * GET /api/search/trending/
 */
export async function fetchTrending(): Promise<TrendingItem[]> {
  const res = await fetch(`${API_BASE}/search/trending/`);
  if (!res.ok) return [];
  return res.json();
}
