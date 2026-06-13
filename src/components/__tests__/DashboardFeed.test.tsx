import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardFeed from "@/components/feed/DashboardFeed";

const mockUser = {
  email: "a@b.com",
  name: "Alice",
  exam_tracks: ["upsc-cse", "ibps-po"],
  subscription_tier: "trial",
  streak_count: 5,
  language: "en",
};

const mockClusters = [
  {
    id: 1,
    topic_id: "t1",
    primary_title: "RBI Rate Hike 2026",
    primary_url: "https://example.com/1",
    source_name: "PIB",
    category_slug: "economy",
    published_at: "2026-06-10T00:00:00Z",
    summary: "RBI raised rates.",
    source_names: ["PIB"],
    image_url: "",
    gs_paper_tag: "GS Paper III – Economy",
    exam_targets: ["upsc-cse"],
    exam_angle: [{ label: "Prelims", text: "NPCI" }],
    reading_minutes: 3,
    created_at: "2026-06-10T00:00:00Z",
  },
  {
    id: 2,
    topic_id: "t2",
    primary_title: "Banking Reform Bill",
    primary_url: "https://example.com/2",
    source_name: "IE",
    category_slug: "economy",
    published_at: "2026-06-10T00:00:00Z",
    summary: "New bill introduced.",
    source_names: ["IE"],
    image_url: "",
    exam_targets: ["ibps-po"],
    reading_minutes: 2,
    created_at: "2026-06-10T00:00:00Z",
  },
  {
    id: 3,
    topic_id: "t3",
    primary_title: "General News Without Track",
    primary_url: "https://example.com/3",
    source_name: "PTI",
    category_slug: "india",
    published_at: "2026-06-10T00:00:00Z",
    summary: "General.",
    source_names: ["PTI"],
    image_url: "",
    exam_targets: [],
    reading_minutes: 1,
    created_at: "2026-06-10T00:00:00Z",
  },
];

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock("@/lib/api", () => ({
  fetchFeed: vi.fn(),
  fetchTodayProgress: vi.fn(),
  fetchTracks: vi.fn(),
  markClusterRead: vi.fn(),
}));

vi.mock("@/lib/readState", () => ({
  addReadId: vi.fn(() => new Set([1])),
  getReadIds: vi.fn(() => new Set([1])),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useRouter: vi.fn(() => ({ replace: vi.fn() })),
  usePathname: vi.fn(() => "/"),
}));

import * as api from "@/lib/api";
import { useSearchParams } from "next/navigation";

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams() as ReturnType<typeof useSearchParams>);
  vi.mocked(api.fetchFeed).mockResolvedValue({
    count: 3,
    results: mockClusters,
    next: null,
    previous: null,
  });
  vi.mocked(api.fetchTracks).mockResolvedValue([
    { slug: "upsc-cse", name: "UPSC CSE", subtitle: "Civil Services", color: "#F97316", active: true },
    { slug: "ibps-po", name: "IBPS PO", subtitle: "Banking", color: "#22C55E", active: true },
  ]);
  vi.mocked(api.fetchTodayProgress).mockResolvedValue({
    date: "2026-06-11",
    total_articles_today: 3,
    articles_read_count: 1,
    completion_percentage: 33,
    minutes_used: 3,
    minutes_target: 30,
    streak_count: 5,
  });
  vi.mocked(api.markClusterRead).mockResolvedValue({
    is_read: true,
    progress: {
      date: "2026-06-11",
      total_articles_today: 3,
      articles_read_count: 2,
      completion_percentage: 67,
      minutes_used: 5,
      minutes_target: 30,
      streak_count: 5,
    },
    streak_count: 5,
  });
});

describe("DashboardFeed", () => {
  it("renders loading skeleton initially", async () => {
    // delay fetch to see skeleton
    vi.mocked(api.fetchFeed).mockImplementationOnce(
      () => new Promise((r) => setTimeout(() => r({ count: 0, results: [], next: null, previous: null }), 500))
    );
    render(<DashboardFeed />);
    // skeletons animate-pulse
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders greeting, streak, and progress", async () => {
    render(<DashboardFeed />);
    await waitFor(() => {
      expect(screen.getByText(/Good (morning|afternoon|evening)/)).toBeInTheDocument();
    });
    expect(screen.getByText(/5-day streak/)).toBeInTheDocument();
    expect(screen.getByText(/Free Trial/)).toBeInTheDocument();
    expect(screen.getByText(/1\/3 read/)).toBeInTheDocument();
  });

  it("renders cluster cards after loading", async () => {
    render(<DashboardFeed />);
    await waitFor(() => {
      expect(screen.getByText("RBI Rate Hike 2026")).toBeInTheDocument();
    });
    expect(screen.getByText("General News Without Track")).toBeInTheDocument();
  });

  it("shows the read state for already-read clusters", async () => {
    render(<DashboardFeed />);
    await waitFor(() => {
      // cluster id 1 is pre-marked as read in the mock
      expect(screen.getByLabelText("Read")).toBeInTheDocument();
    });
  });

  it("track chips appear and filter by track", async () => {
    render(<DashboardFeed />);
    await waitFor(() => {
      expect(screen.getByText("UPSC CSE")).toBeInTheDocument();
    });

    // Click the IBPS PO chip
    await userEvent.click(screen.getByText("IBPS PO"));
    await waitFor(() => {
      // Should show IBPS PO targeted + untagged clusters
      expect(screen.getByText("Banking Reform Bill")).toBeInTheDocument();
      expect(screen.getByText("General News Without Track")).toBeInTheDocument();
    });
    // RBI (upsc-cse only) should not be visible
    expect(screen.queryByText("RBI Rate Hike 2026")).not.toBeInTheDocument();
  });

  it("Active Recall tab shows placeholder content", async () => {
    render(<DashboardFeed />);
    await waitFor(() => {
      expect(screen.getByText("Active Recall")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "Active Recall" }));

    await waitFor(() => {
      expect(screen.getByText("Coming soon")).toBeInTheDocument();
      expect(
        screen.getByText(/Spaced-repetition MCQs from the stories you read 1, 3 and 7 days ago/)
      ).toBeInTheDocument();
    });
    expect(screen.queryByText("RBI Rate Hike 2026")).not.toBeInTheDocument();
  });

  it("opens Active Recall tab when tab=recall is in the URL", async () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("tab=recall") as ReturnType<typeof useSearchParams>
    );
    render(<DashboardFeed />);
    await waitFor(() => {
      expect(screen.getByText("Coming soon")).toBeInTheDocument();
    });
  });

  it("shows empty state when no clusters match", async () => {
    vi.mocked(api.fetchFeed).mockResolvedValue({
      count: 0,
      results: [],
      next: null,
      previous: null,
    });
    render(<DashboardFeed />);
    await waitFor(() => {
      expect(screen.getByText(/No stories yet/)).toBeInTheDocument();
    });
  });

  it("shows batch banner", async () => {
    render(<DashboardFeed />);
    await waitFor(() => {
      expect(screen.getByText(/Tomorrow.*batch drops/)).toBeInTheDocument();
    });
  });

  it("marking a cluster read updates progress", async () => {
    render(<DashboardFeed />);
    await waitFor(() => {
      // mark-read button for cluster 2 (not yet read)
      const btns = screen.getAllByLabelText(/Mark as read/i);
      expect(btns.length).toBeGreaterThan(0);
    });

    const markReadBtns = screen.getAllByLabelText(/Mark as read/i);
    await userEvent.click(markReadBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/2\/3 read/)).toBeInTheDocument();
    });
  });
});
