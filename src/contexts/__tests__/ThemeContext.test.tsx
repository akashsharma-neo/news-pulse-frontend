import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { THEME_ACCENT_KEY, THEME_MODE_KEY } from "@/lib/theme";

function Probe() {
  const { mode, accent, setMode, setAccent } = useTheme();
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <span data-testid="accent">{accent}</span>
      <button type="button" onClick={() => setMode("light")}>
        light
      </button>
      <button type="button" onClick={() => setAccent("indigo")}>
        indigo
      </button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("data-accent");
});

describe("ThemeProvider", () => {
  it("applies stored theme on mount", () => {
    localStorage.setItem(THEME_MODE_KEY, "light");
    localStorage.setItem(THEME_ACCENT_KEY, "emerald");
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    expect(screen.getByTestId("mode").textContent).toBe("light");
    expect(screen.getByTestId("accent").textContent).toBe("emerald");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(document.documentElement.getAttribute("data-accent")).toBe("emerald");
  });

  it("persists theme changes", async () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    await userEvent.click(screen.getByText("light"));
    await userEvent.click(screen.getByText("indigo"));
    expect(localStorage.getItem(THEME_MODE_KEY)).toBe("light");
    expect(localStorage.getItem(THEME_ACCENT_KEY)).toBe("indigo");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(document.documentElement.getAttribute("data-accent")).toBe("indigo");
  });
});
