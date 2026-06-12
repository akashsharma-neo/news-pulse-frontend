import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";

const MOCK_TRACKS = [
  { slug: "upsc-cse", name: "UPSC CSE", subtitle: "Civil Services · IAS / IPS / IFS", color: "#F97316", active: true },
  { slug: "ibps-po", name: "IBPS PO / Clerk", subtitle: "Banking · RRB · SBI", color: "#22C55E", active: true },
  { slug: "ssc-cgl", name: "SSC CGL", subtitle: "Combined Graduate Level", color: "#6366F1", active: true },
];

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  fetchTracks: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

import { useAuth } from "@/contexts/AuthContext";
import * as api from "@/lib/api";

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.fetchTracks).mockResolvedValue(MOCK_TRACKS);
  vi.mocked(useAuth).mockReturnValue({
    completeOnboarding: vi.fn(),
  } as any);
});

describe("OnboardingFlow", () => {
  it("loads and renders exam tracks", async () => {
    render(<OnboardingFlow />);
    await waitFor(() => {
      expect(screen.getByText("UPSC CSE")).toBeInTheDocument();
    });
    expect(screen.getByText("IBPS PO / Clerk")).toBeInTheDocument();
    expect(screen.getByText("SSC CGL")).toBeInTheDocument();
  });

  it("shows Step 1 of 2 initially", async () => {
    render(<OnboardingFlow />);
    await waitFor(() => {
      expect(screen.getByText(/Step 1 of 2/)).toBeInTheDocument();
    });
    expect(screen.getByText("Choose your exam track")).toBeInTheDocument();
  });

  it("toggling a track sets it as selected", async () => {
    render(<OnboardingFlow />);
    await waitFor(() => {
      expect(screen.getByText("UPSC CSE")).toBeInTheDocument();
    });

    const upscBtn = screen.getByText("UPSC CSE").closest("button")!;
    await userEvent.click(upscBtn);
    expect(upscBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("toggle twice deselects", async () => {
    render(<OnboardingFlow />);
    await waitFor(() => {
      expect(screen.getByText("UPSC CSE")).toBeInTheDocument();
    });

    const upscBtn = screen.getByText("UPSC CSE").closest("button")!;
    await userEvent.click(upscBtn);
    expect(upscBtn).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(upscBtn);
    expect(upscBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("Continue button is disabled when no track selected", async () => {
    render(<OnboardingFlow />);
    await waitFor(() => {
      const continueBtn = screen.getByText("Continue");
      expect(continueBtn.closest("button")).toBeDisabled();
    });
  });

  it("Continue button advances to step 2 when tracks selected", async () => {
    render(<OnboardingFlow />);
    await waitFor(() => screen.getByText("UPSC CSE"));

    await userEvent.click(screen.getByText("UPSC CSE").closest("button")!);
    await userEvent.click(screen.getByText("Continue"));

    await waitFor(() => {
      expect(screen.getByText(/Step 2 of 2/)).toBeInTheDocument();
    });
    expect(screen.getByText("Pick your language")).toBeInTheDocument();
  });

  it("step 2 shows language options", async () => {
    render(<OnboardingFlow />);
    await waitFor(() => screen.getByText("UPSC CSE"));

    await userEvent.click(screen.getByText("UPSC CSE").closest("button")!);
    await userEvent.click(screen.getByText("Continue"));

    await waitFor(() => {
      expect(screen.getAllByText("English").length).toBeGreaterThan(0);
    });
    expect(screen.getByText("Hindi")).toBeInTheDocument();
  });

  it("selecting Hindi and finishing calls completeOnboarding", async () => {
    const completeOnboarding = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useAuth).mockReturnValue({ completeOnboarding } as any);

    render(<OnboardingFlow />);
    await waitFor(() => screen.getByText("UPSC CSE"));

    await userEvent.click(screen.getByText("UPSC CSE").closest("button")!);
    await userEvent.click(screen.getByText("Continue"));
    await waitFor(() => screen.getByText("Hindi"));

    await userEvent.click(screen.getByText("Hindi").closest("button")!);
    await userEvent.click(screen.getByText("Get Started"));

    await waitFor(() => {
      expect(completeOnboarding).toHaveBeenCalledWith({
        exam_tracks: ["upsc-cse"],
        language: "hi",
      });
    });
  });

  it("shows saving state on the button while onboarding saves", async () => {
    const completeOnboarding = vi.fn(() => new Promise(() => {})); // never resolves
    vi.mocked(useAuth).mockReturnValue({ completeOnboarding } as any);

    render(<OnboardingFlow />);
    await waitFor(() => screen.getByText("UPSC CSE"));

    await userEvent.click(screen.getByText("UPSC CSE").closest("button")!);
    await userEvent.click(screen.getByText("Continue"));
    await waitFor(() => screen.getByText("Get Started"));

    await userEvent.click(screen.getByText("Get Started"));
    expect(screen.getByText("Setting up…")).toBeInTheDocument();
  });

  it("shows error when fetchTracks fails", async () => {
    vi.mocked(api.fetchTracks).mockRejectedValueOnce(new Error("Network"));
    render(<OnboardingFlow />);
    await waitFor(() => {
      expect(screen.getByText(/Couldn't load exam tracks/)).toBeInTheDocument();
    });
  });

  it("shows error when onboarding save fails", async () => {
    const completeOnboarding = vi.fn().mockRejectedValue(new Error("Server down"));
    vi.mocked(useAuth).mockReturnValue({ completeOnboarding } as any);

    render(<OnboardingFlow />);
    await waitFor(() => screen.getByText("UPSC CSE"));

    await userEvent.click(screen.getByText("UPSC CSE").closest("button")!);
    await userEvent.click(screen.getByText("Continue"));
    await waitFor(() => screen.getByText("Get Started"));

    await userEvent.click(screen.getByText("Get Started"));
    await waitFor(() => {
      expect(screen.getByText(/Couldn't save your choices/)).toBeInTheDocument();
    });
  });

  it("Back button returns from step 2 to step 1", async () => {
    render(<OnboardingFlow />);
    await waitFor(() => screen.getByText("UPSC CSE"));

    await userEvent.click(screen.getByText("UPSC CSE").closest("button")!);
    await userEvent.click(screen.getByText("Continue"));
    await waitFor(() => screen.getByText("Pick your language"));

    await userEvent.click(screen.getByText("Back"));
    await waitFor(() => {
      expect(screen.getByText("Choose your exam track")).toBeInTheDocument();
    });
  });
});
