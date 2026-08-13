import { CheckoutSummary } from "@/components/checkout/checkout-summary";
import { PaymentState } from "@/components/checkout/payment-state";
import { SiteShell } from "@/components/shell/site-shell";

export default function CheckoutPage() {
  return (
    <SiteShell
      title="Checkout"
      subtitle="Review your order before submitting the simulated payment."
    >
      <section
        style={{
          display: "grid",
          gap: "20px",
          maxWidth: "640px",
        }}
      >
        <CheckoutSummary
          event={{
            id: "event-1",
            title: "Neon Horizon",
            startsAt: "2026-09-10T20:00:00Z",
            venueName: "Grand Cinema",
          }}
          quantity={2}
          unitPrice="18.00"
        />
        <PaymentState status="pending" />
        <button
          type="button"
          style={{
            background: "var(--accent)",
            border: "none",
            borderRadius: "9999px",
            color: "#121414",
            fontWeight: 700,
            padding: "14px 18px",
          }}
        >
          Submit simulated payment
        </button>
      </section>
    </SiteShell>
  );
}
