import type { TicketSummary } from "@/lib/mappers";

type TicketCardProps = {
  ticket: TicketSummary;
  title: string;
  venue: string;
  startsAt: string;
  label?: string;
};

export function TicketCard({
  ticket,
  title,
  venue,
  startsAt,
  label = "Admit one",
}: TicketCardProps) {
  return (
    <article
      aria-label={`${title} ticket`}
      style={{
        background: "linear-gradient(180deg, #1A2337 0%, #161d2f 100%)",
        border: "2px solid var(--accent)",
        borderRadius: "20px",
        color: "var(--text)",
        display: "grid",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "grid", gap: "16px", padding: "24px" }}>
        <div
          style={{
            border: "2px solid var(--accent-strong)",
            display: "inline-flex",
            padding: "6px 10px",
            width: "fit-content",
          }}
        >
          <span
            style={{
              color: "var(--accent-strong)",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            {label}
          </span>
        </div>
        <div style={{ display: "grid", gap: "6px" }}>
          <h2 style={{ margin: 0, fontSize: "clamp(32px, 4vw, 44px)" }}>
            {title}
          </h2>
          <p style={{ color: "var(--muted)", margin: 0 }}>{venue}</p>
        </div>
        <div
          style={{
            borderTop: "2px dashed rgba(255, 235, 192, 0.5)",
            display: "grid",
            gap: "14px",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            paddingTop: "18px",
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
              Date
            </div>
            <div style={{ marginTop: "6px" }}>{startsAt}</div>
          </div>
          <div>
            <div
              style={{
                color: "var(--muted)",
                fontSize: "12px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              Ticket
            </div>
            <div style={{ marginTop: "6px", letterSpacing: "0.12em" }}>
              {ticket.id}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
