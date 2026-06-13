import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import BottomNav from "@/components/nav/BottomNav";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
}));

import { usePathname } from "next/navigation";

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(usePathname).mockReturnValue("/");
});

describe("BottomNav", () => {
  it("renders Feed and Account tabs", () => {
    render(<BottomNav />);
    expect(screen.getByText("Feed")).toBeInTheDocument();
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.queryByText("Daily Duel")).not.toBeInTheDocument();
    expect(screen.queryByText("Upgrade")).not.toBeInTheDocument();
  });

  it("marks the Feed tab as active when pathname is /", () => {
    render(<BottomNav />);
    const feedLink = screen.getByText("Feed").closest("a")!;
    expect(feedLink).toHaveAttribute("aria-current", "page");
  });

  it("marks Account as active when pathname starts with /settings", () => {
    vi.mocked(usePathname).mockReturnValue("/settings");
    render(<BottomNav />);
    expect(screen.getByText("Account").closest("a")).toHaveAttribute("aria-current", "page");
  });

  it("uses the active prop when provided, ignoring pathname", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<BottomNav active="settings" />);
    expect(screen.getByText("Account").closest("a")).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Feed").closest("a")).not.toHaveAttribute("aria-current");
  });

  it("has correct hrefs", () => {
    render(<BottomNav />);
    expect(screen.getByText("Feed").closest("a")).toHaveAttribute("href", "/");
    expect(screen.getByText("Account").closest("a")).toHaveAttribute("href", "/settings");
  });
});
