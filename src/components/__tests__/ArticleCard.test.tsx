import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ArticleCard from "@/components/feed/ArticleCard";
import type { TopicCluster } from "@/lib/api";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function makeCluster(overrides: Partial<TopicCluster> = {}): TopicCluster {
  return {
    id: 1,
    topic_id: "t1",
    primary_title: "UPI Transactions Hit Record",
    primary_url: "https://example.com",
    source_name: "PIB",
    category_slug: "economy",
    published_at: "2026-06-08T00:00:00Z",
    summary: "",
    source_names: [],
    image_url: "",
    gs_paper_tag: "GS Paper III – Economy",
    exam_angle: [{ label: "Prelims", text: "NPCI structure" }],
    reading_minutes: 1,
    created_at: "2026-06-08T00:00:00Z",
    ...overrides,
  };
}

afterEach(() => vi.clearAllMocks());

describe("ArticleCard", () => {
  it("renders the title, GS pill label and read time", () => {
    render(<ArticleCard cluster={makeCluster()} isRead={false} onMarkRead={vi.fn()} />);
    expect(screen.getByText("UPI Transactions Hit Record")).toBeInTheDocument();
    expect(screen.getByText("GS III · Economy")).toBeInTheDocument();
    expect(screen.getByText(/1 Min/)).toBeInTheDocument();
  });

  it("shows the high-yield badge when an exam angle exists", () => {
    render(<ArticleCard cluster={makeCluster()} isRead={false} onMarkRead={vi.fn()} />);
    expect(screen.getByText(/high yield/i)).toBeInTheDocument();
  });

  it("hides the high-yield badge without an exam angle", () => {
    render(
      <ArticleCard cluster={makeCluster({ exam_angle: [] })} isRead={false} onMarkRead={vi.fn()} />
    );
    expect(screen.queryByText(/high yield/i)).not.toBeInTheDocument();
  });

  it("fires onMarkRead when the mark-read control is clicked", async () => {
    const onMarkRead = vi.fn();
    render(<ArticleCard cluster={makeCluster()} isRead={false} onMarkRead={onMarkRead} />);
    await userEvent.click(screen.getByLabelText(/mark as read/i));
    expect(onMarkRead).toHaveBeenCalledWith(1);
  });

  it("shows a read state and no mark-read button once read", () => {
    render(<ArticleCard cluster={makeCluster()} isRead onMarkRead={vi.fn()} />);
    expect(screen.getByLabelText("Read")).toBeInTheDocument();
    expect(screen.queryByLabelText(/mark as read/i)).not.toBeInTheDocument();
  });
});
