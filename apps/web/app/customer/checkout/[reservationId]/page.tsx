import { CheckoutSummary } from "@/components/checkout/checkout-summary";
import { PaymentState } from "@/components/checkout/payment-state";
import { SiteShell } from "@/components/shell/site-shell";
import { createReservation, submitPayment } from "@/lib/api";
import { mapEventSummary } from "@/lib/mappers";

const checkoutEvent = mapEventSummary({
  id: "event-1",
  title: "Neon Horizon",
  starts_at: "2026-09-10T20:00:00Z",
  venue_name: "Grand Cinema",
  price: "18.00",
});

export default function CheckoutPage() {
  void createReservation("event-1", 2);
  void submitPayment("reservation-1", "tok_declined");

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
          event={checkoutEvent}
          quantity={2}
          unitPrice="18.00"
        />
        <PaymentState status="pending" />
        <PaymentState status="approved" />
        <PaymentState status="declined" />
        <PaymentState status="conflict" />
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
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
          <a
            href="/customer/tickets"
            style={{
              border: "1px solid rgba(78, 70, 51, 0.8)",
              borderRadius: "9999px",
              padding: "14px 18px",
            }}
          >
            Return to tickets
          </a>
        </div>
      </section>
    </SiteShell>
  );
}
