import type { EventSummary } from "@/lib/mappers";

type CheckoutSummaryProps = {
  event: EventSummary;
  quantity: number;
  unitPrice?: string;
};

export function CheckoutSummary({
  event,
  quantity,
  unitPrice = "0.00",
}: CheckoutSummaryProps) {
  return (
    <section
      style={{
        display: "grid",
        gap: "16px",
        background: "var(--surface)",
        border: "1px solid rgba(78, 70, 51, 0.8)",
        borderRadius: "var(--radius-md)",
        padding: "20px",
      }}
    >
      <div>
        <div
          style={{
            color: "var(--muted)",
            fontSize: "12px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          Order review
        </div>
        <h2 style={{ margin: "8px 0 0" }}>{event.title}</h2>
      </div>
      <dl
        style={{
          display: "grid",
          gap: "8px",
          gridTemplateColumns: "auto 1fr",
        }}
      >
        <dt>Venue</dt>
        <dd>{event.venueName ?? "Venue pending"}</dd>
        <dt>Date</dt>
        <dd>{event.startsAt ?? "Date pending"}</dd>
        <dt>Quantity</dt>
        <dd>{quantity}</dd>
        <dt>Unit price</dt>
        <dd>{unitPrice}</dd>
      </dl>
    </section>
  );
}
