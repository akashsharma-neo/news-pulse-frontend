/**
 * NewsPulse API client.
 *
 * Thin wrapper around fetch for the Django REST API.
 * All endpoints are typed with simple interfaces.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

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
  const params = new URLSearchParams({ tab, page: String(page), page_size: String(pageSize) });
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
