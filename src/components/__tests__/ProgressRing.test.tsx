import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProgressRing from "@/components/feed/ProgressRing";

describe("ProgressRing", () => {
  it("shows minutes used and percent-left while in progress", () => {
    render(<ProgressRing used={17} target={30} />);
    expect(screen.getByText("17")).toBeInTheDocument();
    expect(screen.getByText("/30 min")).toBeInTheDocument();
    expect(screen.getByText(/% left/)).toBeInTheDocument();
    expect(screen.getByLabelText("17 of 30 minutes done")).toBeInTheDocument();
  });

  it("shows Done once the target is reached", () => {
    render(<ProgressRing used={30} target={30} />);
    expect(screen.getByText("✓ Done")).toBeInTheDocument();
  });

  it("clamps an empty target to a 30-minute default", () => {
    render(<ProgressRing used={0} target={0} />);
    expect(screen.getByText("/30 min")).toBeInTheDocument();
  });
});
