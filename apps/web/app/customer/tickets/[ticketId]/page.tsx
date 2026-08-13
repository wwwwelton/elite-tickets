import { SiteShell } from "@/components/shell/site-shell";

type TicketDetailPageProps = {
  params: {
    ticketId: string;
  };
};

export default function TicketDetailPage({
  params,
}: TicketDetailPageProps) {
  const { ticketId } = params;

  return (
    <SiteShell
      title="Ticket Detail"
      subtitle="A premium ticket view with a secure QR credential and share action."
    >
      <div style={{ display: "grid", gap: "20px", maxWidth: "640px" }}>
        <section
          aria-label="Ticket summary"
          style={{
            background: "var(--surface-container)",
            border: "1px solid rgba(78, 70, 51, 0.9)",
            borderRadius: "24px",
            boxShadow: "var(--shadow-soft)",
            display: "grid",
            gap: "16px",
            padding: "24px",
          }}
        >
          <div style={{ display: "grid", gap: "6px" }}>
            <span
              style={{
                color: "var(--accent-strong)",
                fontSize: "12px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}
            >
              Verified ticket
            </span>
            <h2 style={{ margin: 0, fontSize: "28px" }}>Ticket {ticketId}</h2>
            <p style={{ color: "var(--muted)", margin: 0 }}>
              Real event, seat, and owner details will be injected from the
              verified backend in the API wiring task.
            </p>
          </div>

          <div
            aria-label="Secure QR credential"
            style={{
              alignItems: "center",
              background: "var(--surface-container-lowest)",
              border: "1px solid rgba(78, 70, 51, 0.9)",
              borderRadius: "20px",
              display: "grid",
              gap: "14px",
              justifyItems: "center",
              padding: "22px",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255, 235, 192, 0.92), rgba(243, 192, 25, 0.7))",
                borderRadius: "20px",
                boxShadow: "inset 0 0 0 12px rgba(18, 20, 20, 0.9)",
                height: "220px",
                width: "220px",
              }}
            />
            <div style={{ display: "grid", gap: "4px", textAlign: "center" }}>
              <span
                style={{
                  color: "var(--muted)",
                  fontSize: "12px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                Secure credential
              </span>
              <strong style={{ letterSpacing: "0.12em" }}>
                QR credential renders from backend ticket data
              </strong>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            <a href="/customer/tickets">Back to My Tickets</a>
            <a href="/shared/tickets/example-share-token">Share preview</a>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
