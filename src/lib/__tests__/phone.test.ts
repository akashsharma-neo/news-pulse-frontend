import { describe, it, expect } from "vitest";
import {
  displayIndianPhone,
  formatIndianPhoneInput,
  normalizeIndianPhone,
} from "@/lib/phone";

describe("normalizeIndianPhone", () => {
  it("adds +91 to a 10-digit local number", () => {
    expect(normalizeIndianPhone("9876543210")).toBe("+919876543210");
  });

  it("preserves numbers already prefixed with +91", () => {
    expect(normalizeIndianPhone("+91 98765 43210")).toBe("+919876543210");
  });

  it("normalizes 91 without plus", () => {
    expect(normalizeIndianPhone("919876543210")).toBe("+919876543210");
  });

  it("strips a leading 0 from local numbers", () => {
    expect(normalizeIndianPhone("09876543210")).toBe("+919876543210");
  });
});

describe("formatIndianPhoneInput", () => {
  it("keeps only digits and caps at 10", () => {
    expect(formatIndianPhoneInput("98 765-43210 extra")).toBe("9876543210");
    expect(formatIndianPhoneInput("98765432109999")).toBe("9876543210");
  });

  it("strips +91 prefix when pasting a full number", () => {
    expect(formatIndianPhoneInput("+91 98765 43210")).toBe("9876543210");
    expect(formatIndianPhoneInput("919876543210")).toBe("9876543210");
  });
});

describe("displayIndianPhone", () => {
  it("formats with +91 prefix", () => {
    expect(displayIndianPhone("9876543210")).toBe("+91 9876543210");
  });
});
