import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UpgradeScreen from "@/components/upgrade/UpgradeScreen";

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

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: vi.fn(() => "/"),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { useAuth } from "@/contexts/AuthContext";
import * as billingApi from "@/lib/billing-api";
import * as razorpay from "@/lib/razorpay";

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

describe("UpgradeScreen", () => {
  it("shows loading spinner initially", () => {
    render(<UpgradeScreen />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders plan list after loading", async () => {
    render(<UpgradeScreen />);
    await waitFor(() => {
      expect(screen.getByText("Go Premium")).toBeInTheDocument();
    });
    expect(screen.getByText("Monthly")).toBeInTheDocument();
    expect(screen.getByText("Annual")).toBeInTheDocument();
  });

  it("shows dev mode banner when no razorpay key", async () => {
    render(<UpgradeScreen />);
    await waitFor(() => {
      expect(screen.getByText(/Dev mode/i)).toBeInTheDocument();
    });
  });

  it("shows premium header when already premium", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: MOCK_USER_PREMIUM,
      refreshMe: vi.fn(),
    } as any);
    render(<UpgradeScreen />);
    await waitFor(() => {
      expect(screen.getByText("Your plan")).toBeInTheDocument();
    });
  });

  it("shows expired messaging for expired users", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: MOCK_USER_EXPIRED,
      refreshMe: vi.fn(),
    } as any);
    render(<UpgradeScreen />);
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

    render(<UpgradeScreen />);
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
    render(<UpgradeScreen />);
    await waitFor(() => {
      expect(screen.getByText("Monthly")).toBeInTheDocument();
    });

    await userEvent.click(screen.getAllByText("Subscribe")[0]);
    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });
  });

  it("shows Back to feed link for non-premium users", async () => {
    render(<UpgradeScreen />);
    await waitFor(() => {
      expect(screen.getByText(/Back to feed/)).toBeInTheDocument();
    });
  });

  it("hides Back to feed link for premium users", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: MOCK_USER_PREMIUM,
      refreshMe: vi.fn(),
    } as any);
    render(<UpgradeScreen />);
    await waitFor(() => {
      expect(screen.queryByText(/Back to feed/)).not.toBeInTheDocument();
    });
  });

  it("disables current plan button for premium user on that plan", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: MOCK_USER_PREMIUM,
      refreshMe: vi.fn(),
    } as any);
    render(<UpgradeScreen />);
    await waitFor(() => {
      const currentBtn = screen.getByText("Current plan");
      expect(currentBtn.closest("button")).toBeDisabled();
    });
  });
});
