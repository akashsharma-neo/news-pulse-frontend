/**
 * NewsPulse API client.
 *
 * Thin wrapper around fetch for the Django REST API.
 * All endpoints are typed with simple interfaces.
 */

import { apiBaseUrl } from "@/lib/env";
import { authHeaders, ensureAccessToken } from "@/lib/auth";

const API_BASE = apiBaseUrl;

export interface Tab {
  id: number;
  name: string;
  slug: string;
  order: number;
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
  created_at: string;
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
 * Fetch a single cluster by ID.
 */
export async function fetchCluster(id: number): Promise<TopicCluster> {
  const res = await fetch(`${API_BASE}/clusters/${id}/`);
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

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface SendChatMessageResponse {
  user_message: ChatMessage;
  assistant_message: ChatMessage;
}

async function parseApiError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (data && typeof data.error === "string") return data.error;
  } catch {
    // ignore JSON parse errors
  }
  return `API error: ${res.status}`;
}

/**
 * Fetch chat messages for a cluster thread.
 * clusterId is the numeric TopicCluster PK.
 */
export async function fetchChatMessages(clusterId: number): Promise<ChatMessage[]> {
  const token = await ensureAccessToken();
  const params = new URLSearchParams({ cluster_id: String(clusterId) });
  const res = await fetch(`${API_BASE}/messages/?${params}`, {
    headers: authHeaders(token),
  });
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
  const token = await ensureAccessToken();
  const res = await fetch(`${API_BASE}/messages/send/`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ cluster_id: clusterId, content }),
  });
  if (!res.ok) throw new Error(await parseApiError(res));
  return res.json();
}
