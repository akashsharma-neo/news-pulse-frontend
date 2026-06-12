import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsScreen from "@/components/settings/SettingsScreen";

const mockUser = {
  email: "a@b.com",
  name: "Alice",
  phone: null,
  email_verified: true,
  exam_tracks: ["upsc-cse"],
  language: "en",
  subscription_tier: "trial",
  access_state: "trial" as const,
  streak_count: 3,
  monthly_ai_chat_remaining: 5,
};

const mockLogout = vi.fn();
const mockUpdateProfile = vi.fn();
const mockSetMode = vi.fn();
const mockSetAccent = vi.fn();
const mockReplace = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  fetchTracks: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: vi.fn(() => "/settings"),
}));

vi.mock("@/components/settings/SubscriptionSection", () => ({
  default: () => <section id="subscription">Subscription</section>,
}));

import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { fetchTracks } from "@/lib/api";

beforeEach(() => {
  vi.resetAllMocks();
  mockLogout.mockResolvedValue(undefined);
  mockUpdateProfile.mockResolvedValue(mockUser);
  vi.mocked(useAuth).mockReturnValue({
    user: mockUser,
    logout: mockLogout,
    updateProfile: mockUpdateProfile,
    refreshMe: vi.fn(),
  } as any);
  vi.mocked(useTheme).mockReturnValue({
    mode: "dark",
    accent: "saffron",
    setMode: mockSetMode,
    setAccent: mockSetAccent,
  });
  vi.mocked(fetchTracks).mockResolvedValue([
    { slug: "upsc-cse", name: "UPSC CSE", subtitle: "Civil Services", color: "#F97316", active: true },
  ]);
});

describe("SettingsScreen", () => {
  it("renders account and section headers", async () => {
    render(<SettingsScreen />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Account" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Study" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Appearance" })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Subscription")).toBeInTheDocument();
    });
  });

  it("calls updateProfile when saving name", async () => {
    render(<SettingsScreen />);
    const input = screen.getByLabelText("Display name");
    await userEvent.clear(input);
    await userEvent.type(input, "Bob");
    await userEvent.click(screen.getByText("Save name"));
    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({ name: "Bob" });
    });
  });

  it("calls logout and navigates home on sign out", async () => {
    render(<SettingsScreen />);
    await userEvent.click(screen.getByText("Sign out"));
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  it("toggles theme mode", async () => {
    render(<SettingsScreen />);
    await userEvent.click(screen.getByRole("button", { name: "light" }));
    expect(mockSetMode).toHaveBeenCalledWith("light");
  });
});
