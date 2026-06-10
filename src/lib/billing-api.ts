import { apiBaseUrl } from "@/lib/env";
import { getValidAccessToken } from "@/lib/auth-api";
import type { AuthUser } from "@/lib/auth-api";

const API_BASE = apiBaseUrl;

export interface BillingPlan {
  slug: string;
  name: string;
  amount_paise: number;
  amount_display: string;
  duration_days: number;
  subtitle: string;
  highlight: boolean;
}

export interface CheckoutOrder {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  plan: string;
  prefill: { email: string; contact: string; name: string };
}

export interface VerifyPaymentResponse {
  detail: string;
  user: AuthUser;
  profile: AuthUser;
}

async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getValidAccessToken();
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers as Record<string, string>),
    },
  });
}

export async function fetchBillingPlans(): Promise<{
  plans: BillingPlan[];
  key_id: string;
}> {
  const res = await fetch(`${API_BASE}/billing/plans/`);
  if (!res.ok) throw new Error("Could not load plans.");
  return res.json();
}

export async function createBillingOrder(plan: string): Promise<CheckoutOrder> {
  const res = await authFetch("/billing/create-order/", {
    method: "POST",
    body: JSON.stringify({ plan }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Could not start checkout.");
  }
  return res.json();
}

export async function verifyBillingPayment(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<VerifyPaymentResponse> {
  const res = await authFetch("/billing/verify/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Payment verification failed.");
  }
  return res.json();
}

/** Stub checkout for dev when Razorpay keys are not configured. */
export function stubPaymentIds(orderId: string): {
  razorpay_payment_id: string;
  razorpay_signature: string;
} {
  const paymentId = `pay_stub_${Date.now()}`;
  return {
    razorpay_payment_id: paymentId,
    razorpay_signature: `stub_${orderId}_${paymentId}`,
  };
}
