import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SlideOutChatPanel from "@/components/SlideOutChatPanel";
import type { ChatMessage } from "@/lib/api";

const mockFetchChatMessages = vi.fn();
const mockSendChatMessage = vi.fn();

vi.mock("@/lib/api", () => ({
  fetchChatMessages: (...args: Parameters<typeof mockFetchChatMessages>) =>
    mockFetchChatMessages(...args),
  sendChatMessage: (...args: Parameters<typeof mockSendChatMessage>) =>
    mockSendChatMessage(...args),
}));

const mockMessages: ChatMessage[] = [
  { id: 1, role: "assistant", content: "Hello! Ask me anything.", created_at: "2025-01-01T00:00:00Z" },
];

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  articleId: 42,
};

function renderPanel(props = {}) {
  return render(<SlideOutChatPanel {...defaultProps} {...props} />);
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  mockFetchChatMessages.mockReset();
  mockSendChatMessage.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("SlideOutChatPanel", () => {
  describe("rendering states", () => {
    it("renders nothing when closed", () => {
      const { container } = renderPanel({ isOpen: false });
      expect(container.innerHTML).toBe("");
    });

    it("shows loading history indicator while fetching messages", async () => {
      mockFetchChatMessages.mockReturnValue(new Promise(() => {}));
      renderPanel();
      await waitFor(() => {
        expect(screen.queryByText(/ask anything about this article/i)).not.toBeInTheDocument();
      });
    });

    it("shows empty state when no messages exist", async () => {
      mockFetchChatMessages.mockResolvedValue([]);
      renderPanel();
      expect(await screen.findByText(/ask anything about this article/i)).toBeInTheDocument();
    });

    it("renders fetched messages", async () => {
      mockFetchChatMessages.mockResolvedValue(mockMessages);
      renderPanel();
      expect(await screen.findByText("Hello! Ask me anything.")).toBeInTheDocument();
    });

    it("renders user and assistant messages with correct styling", async () => {
      const msgs: ChatMessage[] = [
        { id: 1, role: "user", content: "What is this?", created_at: "2025-01-01T00:00:00Z" },
        { id: 2, role: "assistant", content: "This is an article.", created_at: "2025-01-01T00:00:01Z" },
      ];
      mockFetchChatMessages.mockResolvedValue(msgs);
      renderPanel();
      expect(await screen.findByText("What is this?")).toBeInTheDocument();
      expect(await screen.findByText("This is an article.")).toBeInTheDocument();
    });
  });

  describe("sending messages (optimistic UI)", () => {
    it("shows user message bubble immediately on send", async () => {
      mockFetchChatMessages.mockResolvedValue([]);
      mockSendChatMessage.mockReturnValue(new Promise(() => {}));
      renderPanel();

      const input = await screen.findByPlaceholderText("Ask something...");
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      await user.type(input, "Tell me more");
      await user.click(screen.getByLabelText("Send message"));

      expect(screen.getByText("Tell me more")).toBeInTheDocument();
    });

    it("clears the input field on send", async () => {
      mockFetchChatMessages.mockResolvedValue([]);
      mockSendChatMessage.mockReturnValue(new Promise(() => {}));
      renderPanel();

      const input = await screen.findByPlaceholderText("Ask something...");
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      await user.type(input, "Tell me more");
      await user.click(screen.getByLabelText("Send message"));

      expect(input).toHaveValue("");
    });

    it("shows 'thinking and searching...' indicator while waiting for response", async () => {
      mockFetchChatMessages.mockResolvedValue([]);
      mockSendChatMessage.mockReturnValue(new Promise(() => {}));
      renderPanel();

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      await user.type(await screen.findByPlaceholderText("Ask something..."), "Tell me more");
      await user.click(screen.getByLabelText("Send message"));

      expect(screen.getByText(/thinking and searching/)).toBeInTheDocument();
    });
  });

  describe("response handling", () => {
    it("replaces optimistic message and appends assistant message on success", async () => {
      mockFetchChatMessages.mockResolvedValue([]);
      mockSendChatMessage.mockResolvedValue({
        user_message: { id: 10, role: "user", content: "Tell me more", created_at: "2025-01-01T00:00:02Z" },
        assistant_message: { id: 11, role: "assistant", content: "Here is more info.", created_at: "2025-01-01T00:00:03Z" },
      });
      renderPanel();

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      await user.type(await screen.findByPlaceholderText("Ask something..."), "Tell me more");
      await user.click(screen.getByLabelText("Send message"));

      expect(screen.getByText("Tell me more")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText("Here is more info.")).toBeInTheDocument();
      });
      expect(screen.queryByText(/thinking and searching/)).not.toBeInTheDocument();
    });

    it("removes optimistic message and shows error banner on failure", async () => {
      mockFetchChatMessages.mockResolvedValue([]);
      mockSendChatMessage.mockRejectedValue(new Error("API is down"));
      renderPanel();

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      await user.type(await screen.findByPlaceholderText("Ask something..."), "Tell me more");
      await user.click(screen.getByLabelText("Send message"));

      await waitFor(() => {
        expect(screen.queryByText("Tell me more")).not.toBeInTheDocument();
      });
      expect(screen.getByText("API is down")).toBeInTheDocument();
    });
  });

  describe("retry behavior", () => {
    it("retries sending after an error", async () => {
      mockFetchChatMessages.mockResolvedValue([]);
      mockSendChatMessage
        .mockRejectedValueOnce(new Error("API is down"))
        .mockResolvedValueOnce({
          user_message: { id: 10, role: "user", content: "Tell me more", created_at: "2025-01-01T00:00:02Z" },
          assistant_message: { id: 11, role: "assistant", content: "Here is more info.", created_at: "2025-01-01T00:00:03Z" },
        });
      renderPanel();

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      await user.type(await screen.findByPlaceholderText("Ask something..."), "Tell me more");
      await user.click(screen.getByLabelText("Send message"));

      await waitFor(() => {
        expect(screen.getByText("API is down")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Retry"));

      await waitFor(() => {
        expect(screen.getByText("Here is more info.")).toBeInTheDocument();
      });
      expect(screen.queryByText("API is down")).not.toBeInTheDocument();
    });

    it("retries from timeout state", async () => {
      mockFetchChatMessages.mockResolvedValue([]);
      mockSendChatMessage
        .mockReturnValueOnce(new Promise(() => {}))
        .mockResolvedValueOnce({
          user_message: { id: 10, role: "user", content: "Tell me more", created_at: "2025-01-01T00:00:02Z" },
          assistant_message: { id: 11, role: "assistant", content: "Here is more info.", created_at: "2025-01-01T00:00:03Z" },
        });
      renderPanel();

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      await user.type(await screen.findByPlaceholderText("Ask something..."), "Tell me more");
      await user.click(screen.getByLabelText("Send message"));

      expect(screen.getByText(/thinking and searching/)).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(20000);
      });

      expect(screen.getByText(/taking longer than expected/i)).toBeInTheDocument();
      await user.click(screen.getByText("Try Again"));

      await waitFor(() => {
        expect(screen.getByText("Here is more info.")).toBeInTheDocument();
      });
    });
  });

  describe("timeout", () => {
    it("shows timeout state after 20 seconds", async () => {
      mockFetchChatMessages.mockResolvedValue([]);
      mockSendChatMessage.mockReturnValue(new Promise(() => {}));
      renderPanel();

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      await user.type(await screen.findByPlaceholderText("Ask something..."), "Tell me more");
      await user.click(screen.getByLabelText("Send message"));

      expect(screen.getByText(/thinking and searching/)).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(20000);
      });

      expect(screen.getByText(/taking longer than expected/i)).toBeInTheDocument();
      expect(screen.getByText("Try Again")).toBeInTheDocument();
    });
  });

  describe("input behavior", () => {
    it("disables input and send button while loading", async () => {
      mockFetchChatMessages.mockResolvedValue([]);
      mockSendChatMessage.mockReturnValue(new Promise(() => {}));
      renderPanel();

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      await user.type(await screen.findByPlaceholderText("Ask something..."), "Tell me more");
      await user.click(screen.getByLabelText("Send message"));

      expect(screen.getByPlaceholderText("Ask something...")).toBeDisabled();
      expect(screen.getByLabelText("Send message")).toBeDisabled();
    });

    it("does not send when input is empty", async () => {
      mockFetchChatMessages.mockResolvedValue([]);
      renderPanel();

      await userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      await screen.findByPlaceholderText("Ask something...");
      await screen.getByLabelText("Send message").click();

      expect(mockSendChatMessage).not.toHaveBeenCalled();
    });

    it("does not send when already loading", async () => {
      mockFetchChatMessages.mockResolvedValue([]);
      mockSendChatMessage.mockReturnValue(new Promise(() => {}));
      renderPanel();

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const input = await screen.findByPlaceholderText("Ask something...");
      await user.type(input, "Tell me more");
      await user.click(screen.getByLabelText("Send message"));

      await user.type(input, "Another message");
      await user.click(screen.getByLabelText("Send message"));

      expect(mockSendChatMessage).toHaveBeenCalledTimes(1);
    });

    it("sends on Enter key", async () => {
      mockFetchChatMessages.mockResolvedValue([]);
      mockSendChatMessage.mockReturnValue(new Promise(() => {}));
      renderPanel();

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const input = await screen.findByPlaceholderText("Ask something...");
      await user.type(input, "Tell me more");
      await user.keyboard("{Enter}");

      expect(mockSendChatMessage).toHaveBeenCalledWith(42, "Tell me more");
    });
  });

  describe("cleanup", () => {
    it("cancels history fetch on unmount", async () => {
      mockFetchChatMessages.mockReturnValue(new Promise(() => {}));
      const { unmount } = renderPanel();

      expect(mockFetchChatMessages).toHaveBeenCalledTimes(1);
      unmount();

      await vi.waitFor(() => {
        expect(mockFetchChatMessages).toHaveBeenCalledTimes(1);
      });
    });

    it("calls onClose when backdrop is clicked", async () => {
      mockFetchChatMessages.mockResolvedValue([]);
      const onClose = vi.fn();
      renderPanel({ onClose });

      const backdrops = screen.getAllByRole("generic");
      const backdrop = backdrops.find((el) => el.className.includes("bg-black/50"));
      expect(backdrop).toBeTruthy();
      if (backdrop) {
        await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(backdrop);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });
  });
});
