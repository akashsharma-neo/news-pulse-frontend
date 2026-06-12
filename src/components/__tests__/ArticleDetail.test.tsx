import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ArticleDetail from "@/components/detail/ArticleDetail";

const MOCK_CLUSTER = {
  id: 42,
  topic_id: "t42",
  primary_title: "RBI Repo Rate Cut 2026",
  primary_url: "https://example.com/42",
  source_name: "PIB",
  category_slug: "economy",
  published_at: "2026-06-10T00:00:00Z",
  summary: "RBI cut repo rate by 25 bps.",
  source_names: ["PIB"],
  image_url: "",
  gs_paper_tag: "GS Paper III – Economy",
  why_in_news: "RBI announced a 25 bps rate cut.",
  key_facts: ["Repo rate now 6.0%", "MPC voted 5-1"],
  static_anchors: ["RBI Act 1934", "Monetary Policy Committee"],
  exam_angle: [
    { label: "Prelims", text: "MPC composition facts." },
    { label: "Mains GS III", text: "Monetary transmission." },
  ],
  trend_context: "Rates cooled from 6.5% to 6.0% over 2 years.",
  pyqs: [
    { year: 2023, exam: "UPSC Prelims", question: "Who sets repo rate?", answer: "MPC" },
  ],
  reading_minutes: 4,
  language: "en",
  created_at: "2026-06-10T00:00:00Z",
};

vi.mock("@/lib/api", () => ({
  fetchCluster: vi.fn(),
  markClusterRead: vi.fn(),
  toggleBookmark: vi.fn(),
}));

vi.mock("@/lib/readState", () => ({
  addReadId: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(() => ({ isAuthenticated: true })),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
  usePathname: vi.fn(() => "/"),
}));

vi.mock("@/components/ai/AIGuidePanel", () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="ai-guide-panel">
      <button data-testid="btn-close-guide" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

import * as api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.fetchCluster).mockResolvedValue(MOCK_CLUSTER as any);
  vi.mocked(api.markClusterRead).mockResolvedValue({
    is_read: true,
    progress: { articles_read_count: 1 } as any,
    streak_count: 1,
  });
  vi.mocked(api.toggleBookmark).mockResolvedValue(true);
  vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true } as any);
});

describe("ArticleDetail", () => {
  it("shows loading spinner initially", () => {
    render(<ArticleDetail id={42} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders article content after loading", async () => {
    render(<ArticleDetail id={42} />);
    await waitFor(() => {
      expect(screen.getByText("RBI Repo Rate Cut 2026")).toBeInTheDocument();
    });
    expect(screen.getByText(/4 Min Read/)).toBeInTheDocument();
    expect(screen.getByText(/GS III · Economy/)).toBeInTheDocument();
  });

  it("renders Why in News section", async () => {
    render(<ArticleDetail id={42} />);
    await waitFor(() => {
      expect(screen.getByText("RBI announced a 25 bps rate cut.")).toBeInTheDocument();
    });
  });

  it("renders High-Yield Facts", async () => {
    render(<ArticleDetail id={42} />);
    await waitFor(() => {
      expect(screen.getByText("Repo rate now 6.0%")).toBeInTheDocument();
    });
    expect(screen.getByText("MPC voted 5-1")).toBeInTheDocument();
  });

  it("renders Exam Angle sections", async () => {
    render(<ArticleDetail id={42} />);
    await waitFor(() => {
      expect(screen.getByText("Exam Angle")).toBeInTheDocument();
    });
    expect(screen.getByText("Prelims")).toBeInTheDocument();
    expect(screen.getByText("MPC composition facts.")).toBeInTheDocument();
  });

  it("renders Trend Context", async () => {
    render(<ArticleDetail id={42} />);
    await waitFor(() => {
      expect(screen.getByText("Trend Context")).toBeInTheDocument();
    });
  });

  it("renders Related PYQs", async () => {
    render(<ArticleDetail id={42} />);
    await waitFor(() => {
      expect(screen.getByText("Related PYQs")).toBeInTheDocument();
    });
    expect(screen.getByText(/2023 · UPSC Prelims/)).toBeInTheDocument();
  });

  it("shows Ask AI Guide button", async () => {
    render(<ArticleDetail id={42} />);
    await waitFor(() => {
      expect(screen.getByText(/Ask AI Guide/)).toBeInTheDocument();
    });
  });

  it("opens AI Guide panel on button click", async () => {
    render(<ArticleDetail id={42} />);
    await waitFor(() => {
      expect(screen.getByText(/Ask AI Guide/)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText(/Ask AI Guide/));
    expect(screen.getByTestId("ai-guide-panel")).toBeInTheDocument();
  });

  it("closes AI Guide panel", async () => {
    render(<ArticleDetail id={42} />);
    await waitFor(() => screen.getByText(/Ask AI Guide/));

    await userEvent.click(screen.getByText(/Ask AI Guide/));
    expect(screen.getByTestId("ai-guide-panel")).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("btn-close-guide"));
    expect(screen.queryByTestId("ai-guide-panel")).not.toBeInTheDocument();
  });

  it("calls markClusterRead on mount when authenticated", async () => {
    render(<ArticleDetail id={42} />);
    await waitFor(() => {
      expect(api.markClusterRead).toHaveBeenCalledWith(42);
    });
  });

  it("toggles bookmark optimistically", async () => {
    render(<ArticleDetail id={42} />);
    await waitFor(() => screen.getByText("RBI Repo Rate Cut 2026"));

    const bookmarkBtn = screen.getByLabelText("Bookmark");
    expect(bookmarkBtn).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(bookmarkBtn);
    await waitFor(() => {
      expect(bookmarkBtn).toHaveAttribute("aria-pressed", "true");
    });
  });

  it("shows error state when cluster fetch fails", async () => {
    vi.mocked(api.fetchCluster).mockRejectedValueOnce(new Error("Not found"));
    render(<ArticleDetail id={999} />);
    await waitFor(() => {
      expect(screen.getByText(/couldn't be loaded/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Back to feed/)).toBeInTheDocument();
  });

  it("does not call markClusterRead when unauthenticated", async () => {
    vi.mocked(api.fetchCluster).mockResolvedValue(MOCK_CLUSTER as any);
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false } as any);

    render(<ArticleDetail id={42} />);
    await waitFor(() => {
      expect(screen.getByText("RBI Repo Rate Cut 2026")).toBeInTheDocument();
    });
    expect(api.markClusterRead).not.toHaveBeenCalled();
  });
});
