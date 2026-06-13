import { FirebaseError } from "firebase/app";
import { AuthApiError } from "@/lib/auth-api";

type AuthStep = "phone-send" | "phone-verify" | "social";

const FIREBASE_AUTH_MESSAGES: Record<string, string> = {
  "auth/billing-not-enabled":
    "Phone sign-in is not available right now. Try Google or Apple, or try again later.",
  "auth/invalid-phone-number":
    "Enter a valid 10-digit Indian mobile number.",
  "auth/missing-phone-number": "Enter your mobile number to continue.",
  "auth/too-many-requests":
    "Too many attempts. Wait a few minutes, then try again.",
  "auth/invalid-verification-code":
    "That code is incorrect. Check the SMS and try again.",
  "auth/code-expired": "This code has expired. Request a new one.",
  "auth/captcha-check-failed":
    "We could not verify you. Refresh the page and try again.",
  "auth/quota-exceeded":
    "Sign-in is busy right now. Please try again in a little while.",
  "auth/network-request-failed":
    "Check your internet connection and try again.",
  "auth/popup-closed-by-user": "Sign-in was cancelled.",
  "auth/popup-blocked":
    "Allow pop-ups for NexPrep in your browser, then try again.",
  "auth/cancelled-popup-request": "Sign-in was cancelled.",
  "auth/account-exists-with-different-credential":
    "This email is already linked to another sign-in method.",
  "auth/user-disabled":
    "This account is disabled. Contact support if you need help.",
  "auth/operation-not-allowed":
    "This sign-in method is not available right now.",
};

const STEP_FALLBACKS: Record<AuthStep, string> = {
  "phone-send": "We could not send the code. Please try again.",
  "phone-verify": "That code did not work. Please try again.",
  social: "Sign-in did not complete. Please try again.",
};

function isFirebaseError(err: unknown): err is FirebaseError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as FirebaseError).code === "string"
  );
}

/** Map Firebase / auth errors to NexPrep-friendly copy (never raw Firebase text). */
export function friendlyAuthError(err: unknown, step: AuthStep): string {
  if (err instanceof AuthApiError) {
    return err.message;
  }

  if (isFirebaseError(err)) {
    const mapped = FIREBASE_AUTH_MESSAGES[err.code];
    if (mapped) return mapped;
  }

  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes("billing") && msg.includes("not enabled")) {
      return FIREBASE_AUTH_MESSAGES["auth/billing-not-enabled"];
    }
    if (msg.includes("network") || msg.includes("fetch")) {
      return FIREBASE_AUTH_MESSAGES["auth/network-request-failed"];
    }
    if (msg.includes("popup") && msg.includes("blocked")) {
      return FIREBASE_AUTH_MESSAGES["auth/popup-blocked"];
    }
    if (msg.includes("cancelled") || msg.includes("canceled")) {
      return FIREBASE_AUTH_MESSAGES["auth/popup-closed-by-user"];
    }
  }

  return STEP_FALLBACKS[step];
}
