import { SiteShell } from "@/components/shell/site-shell";

type SharedTicketPageProps = {
  params?: {
    shareToken: string;
  };
};

export default function SharedTicketPage({
  params,
}: SharedTicketPageProps) {
  const { shareToken = "example-share-token" } = params ?? {};

  return (
    <SiteShell
      title="Shared ticket"
      subtitle="Public read-only ticket view."
    >
      <div style={{ display: "grid", gap: "20px", justifyItems: "center" }}>
        <section
          aria-label="Shared ticket"
          style={{
            display: "grid",
            gap: "0",
            maxWidth: "420px",
            width: "100%",
          }}
        >
          <div
            style={{
              background: "#1A2337",
              border: "2px solid var(--accent)",
              borderBottom: "0",
              borderRadius: "20px 20px 0 0",
              display: "grid",
              gap: "18px",
              padding: "24px",
            }}
          >
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
                Shared access
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: "clamp(32px, 4vw, 44px)" }}>
              Midnight Syndicate
            </h2>
            <p style={{ color: "var(--muted)", margin: 0 }}>
              Warehouse 21, Brooklyn, NY
            </p>
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
                <div style={{ marginTop: "6px" }}>OCT 31, 2026</div>
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
                  Time
                </div>
                <div style={{ marginTop: "6px" }}>11:00 PM</div>
              </div>
            </div>
          </div>

          <div
            style={{
              alignItems: "center",
              background: "var(--surface-container)",
              border: "2px solid var(--outline-variant)",
              borderTop: "0",
              borderRadius: "0 0 20px 20px",
              display: "grid",
              gap: "16px",
              justifyItems: "center",
              marginTop: "-2px",
              padding: "24px",
            }}
          >
            <div style={{ display: "grid", gap: "6px", textAlign: "center" }}>
              <div
                aria-label="Public share token"
                style={{
                  color: "var(--muted)",
                  fontSize: "12px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                Share token
              </div>
              <div style={{ letterSpacing: "0.16em" }}>{shareToken}</div>
            </div>

            <div
              aria-label="Shared ticket QR placeholder"
              style={{
                background: "var(--surface-container-lowest)",
                border: "1px solid rgba(78, 70, 51, 0.9)",
                borderRadius: "18px",
                display: "grid",
                height: "220px",
                placeItems: "center",
                width: "220px",
              }}
            >
              <div
                style={{
                  background:
                    "repeating-linear-gradient(90deg, var(--surface-container-lowest) 0 12px, rgba(255, 235, 192, 0.75) 12px 20px)",
                  borderRadius: "12px",
                  height: "180px",
                  width: "180px",
                }}
              />
            </div>

            <p style={{ color: "var(--muted)", margin: 0, textAlign: "center" }}>
              Shared tickets omit private account data and remain read-only.
            </p>
          </div>
        </section>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          <a href="/events/event-1">Get your own ticket</a>
          <a href="/customer/tickets">Back to My Tickets</a>
        </div>
      </div>
    </SiteShell>
  );
}
