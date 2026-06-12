import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AIGuidePanel from "@/components/ai/AIGuidePanel";
import type { TopicCluster } from "@/lib/api";

const mockFetchMessages = vi.fn();
const mockFetchQuota = vi.fn();
const mockSend = vi.fn();

vi.mock("@/lib/api", () => ({
  fetchChatMessages: (...a: unknown[]) => mockFetchMessages(...a),
  fetchChatQuota: (...a: unknown[]) => mockFetchQuota(...a),
  sendChatMessage: (...a: unknown[]) => mockSend(...a),
  QuotaExceededError: class QuotaExceededError extends Error {},
}));

function makeCluster(): TopicCluster {
  return {
    id: 7,
    topic_id: "t",
    primary_title: "UPI Record",
    primary_url: "",
    source_name: "PIB",
    category_slug: "economy",
    published_at: "2026-06-08T00:00:00Z",
    summary: "",
    source_names: [],
    image_url: "",
    gs_paper_tag: "GS Paper III – Economy",
    suggested_prompts: ["How can this be asked in Prelims?"],
    created_at: "2026-06-08T00:00:00Z",
  };
}

beforeEach(() => {
  mockFetchMessages.mockResolvedValue([]);
  mockFetchQuota.mockResolvedValue({ used: 1, limit: 10, remaining: 9, resets_at: null });
  mockSend.mockReset();
});

afterEach(() => vi.clearAllMocks());

describe("AIGuidePanel", () => {
  it("shows the context badge, quota and prompt chips", async () => {
    render(<AIGuidePanel cluster={makeCluster()} onClose={vi.fn()} />);
    expect(screen.getByText(/Context: GS Paper III/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "How can this be asked in Prelims?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Explain context" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("9 left today")).toBeInTheDocument());
  });

  it("sends a chip prompt and renders the assistant reply", async () => {
    mockSend.mockResolvedValue({
      assistant_message: { id: 99, role: "assistant", content: "Prelims framing…", created_at: "" },
      quota: { used: 2, limit: 10, remaining: 8, resets_at: null },
    });
    render(<AIGuidePanel cluster={makeCluster()} onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Prelims angle?" }));
    expect(mockSend).toHaveBeenCalledWith(7, "Prelims angle?");
    await waitFor(() => expect(screen.getByText("Prelims framing…")).toBeInTheDocument());
  });

  it("invokes onClose from the close control", async () => {
    const onClose = vi.fn();
    render(<AIGuidePanel cluster={makeCluster()} onClose={onClose} />);
    await userEvent.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalled();
  });
});
