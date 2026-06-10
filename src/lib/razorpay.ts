import type { CheckoutOrder } from "./billing-api";

type RazorpayHandlerResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = { open: () => void };

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(!!window.Razorpay);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(
  order: CheckoutOrder,
  onSuccess: (response: RazorpayHandlerResponse) => void,
  onDismiss?: () => void
): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    throw new Error("Razorpay checkout could not be loaded.");
  }

  const rzp = new window.Razorpay({
    key: order.key_id,
    amount: order.amount,
    currency: order.currency,
    name: "NexPrep",
    description: `${order.plan.replace("_", " ")} plan`,
    order_id: order.order_id,
    prefill: order.prefill,
    theme: { color: "#F97316" },
    handler: onSuccess,
    modal: {
      ondismiss: onDismiss,
    },
  });
  rzp.open();
}
