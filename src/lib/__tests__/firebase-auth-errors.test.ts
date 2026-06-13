import { describe, it, expect } from "vitest";
import { FirebaseError } from "firebase/app";
import { friendlyAuthError } from "@/lib/firebase-auth-errors";

describe("friendlyAuthError", () => {
  it("maps billing-not-enabled without exposing Firebase text", () => {
    const err = new FirebaseError("auth/billing-not-enabled", "BILLING_NOT_ENABLED");
    const msg = friendlyAuthError(err, "phone-send");
    expect(msg).not.toContain("BILLING");
    expect(msg).toContain("Phone sign-in is not available");
  });

  it("maps invalid verification code", () => {
    const err = new FirebaseError("auth/invalid-verification-code", "bad code");
    expect(friendlyAuthError(err, "phone-verify")).toContain("incorrect");
  });

  it("falls back for unknown errors", () => {
    expect(friendlyAuthError(new Error("something weird"), "phone-send")).toBe(
      "We could not send the code. Please try again."
    );
  });
});
