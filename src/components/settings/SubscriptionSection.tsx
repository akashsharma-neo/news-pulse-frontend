"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  createBillingOrder,
  fetchBillingPlans,
  stubPaymentIds,
  verifyBillingPayment,
  type BillingPlan,
} from "@/lib/billing-api";
import { openRazorpayCheckout } from "@/lib/razorpay";
import FullScreenSpinner from "../FullScreenSpinner";

const FEATURES = [
  "Unlimited AI Guide queries",
  "Full daily CA feed for your tracks",
  "Exam anatomy briefs + bookmark sync",
  "Daily Duel when it ships (included)",
];

const TIER_LABELS: Record<string, string> = {
  trial: "Free Trial",
  monthly: "Monthly Pass",
  half_yearly: "6-Month Pass",
  annual: "Annual Pass",
  expired: "Trial Ended",
};

export default function SubscriptionSection() {
  const { user, refreshMe } = useAuth();
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [keyId, setKeyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isPremium = user?.access_state === "premium";

  useEffect(() => {
    fetchBillingPlans()
      .then((data) => {
        setPlans(data.plans);
        setKeyId(data.key_id || "");
      })
      .catch(() => setError("Could not load plans. Pull to refresh or try again."))
      .finally(() => setLoading(false));
  }, []);

  const completePayment = useCallback(
    async (orderId: string, paymentId: string, signature: string) => {
      await verifyBillingPayment({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      });
      await refreshMe();
      setSuccess("You're on NexPrep Premium. Welcome back!");
    },
    [refreshMe]
  );

  async function handleCheckout(planSlug: string) {
    setError(null);
    setBusyPlan(planSlug);
    try {
      const order = await createBillingOrder(planSlug);

      if (!keyId) {
        const stub = stubPaymentIds(order.order_id);
        await completePayment(order.order_id, stub.razorpay_payment_id, stub.razorpay_signature);
        return;
      }

      await openRazorpayCheckout(
        order,
        async (response) => {
          try {
            await completePayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
          } catch (err) {
            setError(err instanceof Error ? err.message : "Verification failed.");
            setBusyPlan(null);
          }
        },
        () => setBusyPlan(null)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      if (!keyId) setBusyPlan(null);
    }
  }

  if (loading) return <FullScreenSpinner />;

  const tierLabel = TIER_LABELS[user?.subscription_tier ?? "trial"] ?? "Trial";

  return (
    <section id="subscription" className="scroll-mt-6">
      <h2 className="label-caps mb-3 text-[10px] text-muted">Subscription</h2>

      <div className="mb-4 rounded-2xl border border-border-subtle bg-surface p-4">
        <p className="font-display text-[15px] font-semibold">
          {isPremium ? "NexPrep Premium" : tierLabel}
        </p>
        <p className="mt-1 text-[13px] text-muted">
          {isPremium
            ? `Active ${TIER_LABELS[user?.subscription_tier ?? ""] ?? "plan"} — unlimited AI Guide.`
            : user?.access_state === "expired"
              ? "Your trial has ended. Pick a plan below to keep reading."
              : "Unlimited AI Guide and full access after your trial."}
        </p>
        {(user?.streak_count ?? 0) > 0 && (
          <p className="mt-2 font-mono text-[12px] text-accent">
            {user?.streak_count}-day streak
          </p>
        )}
        {user?.monthly_ai_chat_remaining != null && (
          <p className="mt-1 font-mono text-[11px] text-muted">
            AI Guide: {user.monthly_ai_chat_remaining} queries left this month
          </p>
        )}
      </div>

      {success && (
        <div className="mb-4 rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-[14px] text-success">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-[14px] text-danger">
          {error}
        </div>
      )}

      {!keyId && !isPremium && (
        <p className="mb-4 rounded-xl border border-border-subtle bg-surface px-3 py-2 text-[12px] text-muted">
          Dev mode: Razorpay keys not set — tapping a plan simulates a successful payment.
        </p>
      )}

      {!isPremium && (
        <>
          <ul className="mb-4 space-y-2">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-[13px] text-foreground">
                <span className="text-success" aria-hidden>
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3">
            {plans.map((plan) => {
              const isCurrent = isPremium && user?.subscription_tier === plan.slug;
              return (
                <div
                  key={plan.slug}
                  className={`rounded-2xl border p-4 transition-colors ${
                    plan.highlight
                      ? "border-accent bg-accent/[0.06] shadow-[0_0_24px_rgba(249,115,22,0.12)]"
                      : "border-border-subtle bg-surface"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-lg font-semibold">{plan.name}</h3>
                        {plan.highlight && (
                          <span className="label-caps rounded bg-accent/20 px-1.5 py-0.5 text-[9px] text-accent">
                            Best value
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[12px] text-muted">{plan.subtitle}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xl text-accent">{plan.amount_display}</div>
                      <div className="text-[11px] text-muted">
                        {plan.duration_days >= 365
                          ? "/ year"
                          : plan.duration_days >= 180
                            ? "/ 6 mo"
                            : "/ mo"}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isCurrent || busyPlan !== null}
                    onClick={() => handleCheckout(plan.slug)}
                    className={`mt-4 w-full rounded-xl py-3 font-display text-[14px] font-semibold transition-opacity disabled:opacity-50 ${
                      plan.highlight
                        ? "bg-accent text-[#0d0e14] hover:opacity-90"
                        : "border border-border-subtle bg-surface-elevated text-foreground hover:border-white/20"
                    }`}
                  >
                    {isCurrent
                      ? "Current plan"
                      : busyPlan === plan.slug
                        ? "Processing…"
                        : plan.highlight
                          ? "Set up UPI AutoPay"
                          : "Subscribe"}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-muted">
            UPI · GPay · PhonePe · Paytm · Netbanking. RBI e-mandate compliant —
            24h pre-debit notice on recurring plans.
          </p>
        </>
      )}
    </section>
  );
}
