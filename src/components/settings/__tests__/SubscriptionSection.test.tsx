import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SubscriptionSection from "@/components/settings/SubscriptionSection";

const MOCK_PLANS = {
  plans: [
    {
      slug: "monthly",
      name: "Monthly",
      amount_paise: 19900,
      amount_display: "₹199",
      duration_days: 30,
      subtitle: "Flexible · cancel anytime",
      highlight: false,
    },
    {
      slug: "annual",
      name: "Annual",
      amount_paise: 179900,
      amount_display: "₹1,799",
      duration_days: 365,
      subtitle: "Best value",
      highlight: true,
    },
  ],
  key_id: "",
};

const MOCK_USER_TRIAL = {
  email: "a@b.com",
  name: "Alice",
  access_state: "trial" as const,
  subscription_tier: "trial",
};

const MOCK_USER_PREMIUM = {
  email: "a@b.com",
  name: "Alice",
  access_state: "premium" as const,
  subscription_tier: "annual",
};

const MOCK_USER_EXPIRED = {
  email: "a@b.com",
  name: "Alice",
  access_state: "expired" as const,
  subscription_tier: "expired",
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/billing-api", () => ({
  fetchBillingPlans: vi.fn(),
  createBillingOrder: vi.fn(),
  stubPaymentIds: vi.fn(),
  verifyBillingPayment: vi.fn(),
}));

vi.mock("@/lib/razorpay", () => ({
  openRazorpayCheckout: vi.fn(),
}));

import { useAuth } from "@/contexts/AuthContext";
import * as billingApi from "@/lib/billing-api";

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(useAuth).mockReturnValue({
    user: MOCK_USER_TRIAL,
    refreshMe: vi.fn(),
  } as any);
  vi.mocked(billingApi.fetchBillingPlans).mockResolvedValue(MOCK_PLANS);
  vi.mocked(billingApi.createBillingOrder).mockResolvedValue({
    order_id: "order_test_123",
    amount: 19900,
    currency: "INR",
    key_id: "",
    plan: "monthly",
    prefill: { email: "a@b.com", contact: "", name: "Alice" },
  });
  vi.mocked(billingApi.stubPaymentIds).mockReturnValue({
    razorpay_payment_id: "pay_stub_123",
    razorpay_signature: "stub_order_test_123_pay_stub_123",
  });
  vi.mocked(billingApi.verifyBillingPayment).mockResolvedValue({
    detail: "Payment verified",
    user: MOCK_USER_PREMIUM as any,
    profile: MOCK_USER_PREMIUM as any,
  });
});

describe("SubscriptionSection", () => {
  it("shows loading spinner initially", () => {
    render(<SubscriptionSection />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders plan list after loading", async () => {
    render(<SubscriptionSection />);
    await waitFor(() => {
      expect(screen.getByText("Monthly")).toBeInTheDocument();
    });
    expect(screen.getByText("Annual")).toBeInTheDocument();
  });

  it("shows dev mode banner when no razorpay key", async () => {
    render(<SubscriptionSection />);
    await waitFor(() => {
      expect(screen.getByText(/Dev mode/i)).toBeInTheDocument();
    });
  });

  it("shows premium status when already premium", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: MOCK_USER_PREMIUM,
      refreshMe: vi.fn(),
    } as any);
    render(<SubscriptionSection />);
    await waitFor(() => {
      expect(screen.getByText("NexPrep Premium")).toBeInTheDocument();
    });
  });

  it("shows expired messaging for expired users", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: MOCK_USER_EXPIRED,
      refreshMe: vi.fn(),
    } as any);
    render(<SubscriptionSection />);
    await waitFor(() => {
      expect(screen.getByText(/trial has ended/)).toBeInTheDocument();
    });
  });

  it("stub checkout flow works end-to-end", async () => {
    const refreshMe = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      user: MOCK_USER_TRIAL,
      refreshMe,
    } as any);

    render(<SubscriptionSection />);
    await waitFor(() => {
      expect(screen.getByText("Monthly")).toBeInTheDocument();
    });

    await userEvent.click(screen.getAllByText("Subscribe")[0]);

    await waitFor(() => {
      expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
    });
    expect(refreshMe).toHaveBeenCalled();
  });

  it("shows error when checkout fails", async () => {
    vi.mocked(billingApi.createBillingOrder).mockRejectedValueOnce(new Error("Server error"));
    render(<SubscriptionSection />);
    await waitFor(() => {
      expect(screen.getByText("Monthly")).toBeInTheDocument();
    });

    await userEvent.click(screen.getAllByText("Subscribe")[0]);
    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });
  });

  it("has subscription anchor id", async () => {
    render(<SubscriptionSection />);
    await waitFor(() => {
      expect(document.getElementById("subscription")).toBeInTheDocument();
    });
  });
});
