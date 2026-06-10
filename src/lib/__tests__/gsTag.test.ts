import { describe, it, expect } from "vitest";
import { paperRoman, gsColor, gsLabel } from "@/lib/gsTag";

describe("gsTag helpers", () => {
  it("extracts the paper roman numeral", () => {
    expect(paperRoman("GS Paper III – Economy")).toBe("III");
    expect(paperRoman("GS Paper IV – Ethics")).toBe("IV");
    expect(paperRoman("GS I · Geography")).toBe("I");
    expect(paperRoman(undefined)).toBeNull();
    expect(paperRoman("General Studies")).toBeNull();
  });

  it("maps paper number to the taxonomy color", () => {
    expect(gsColor("GS Paper I – Polity")).toBe("var(--gs1)");
    expect(gsColor("GS Paper II – Polity")).toBe("var(--gs2)");
    expect(gsColor("GS Paper III – Economy")).toBe("var(--gs3)");
    expect(gsColor("GS Paper IV – Ethics")).toBe("var(--gs4)");
    expect(gsColor(undefined)).toBe("var(--muted)");
  });

  it("shortens the tag into a compact pill label", () => {
    expect(gsLabel("GS Paper III – Economy")).toBe("GS III · Economy");
    expect(gsLabel("GS Paper II - Polity")).toBe("GS II · Polity");
  });

  it("falls back to the category slug when no tag is present", () => {
    expect(gsLabel(undefined, "economy")).toBe("ECONOMY");
    expect(gsLabel("", "world-affairs")).toBe("WORLD AFFAIRS");
  });
});
