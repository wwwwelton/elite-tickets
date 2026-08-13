import { SiteShell } from "@/components/shell/site-shell";

export default function GateHomePage() {
  return (
    <SiteShell
      title="Gate Scanner"
      subtitle="Select the active event, scan a ticket, and validate in a high-contrast workflow."
    >
      <div
        style={{
          display: "grid",
          gap: "20px",
        }}
      >
        <section
          aria-label="Active event"
          style={{
            background: "var(--surface-container)",
            border: "1px solid rgba(78, 70, 51, 0.8)",
            display: "grid",
            gap: "12px",
            padding: "18px",
          }}
        >
          <div
            style={{
              color: "var(--muted)",
              fontSize: "12px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            Active event gate
          </div>
          <label style={{ display: "grid", gap: "10px" }}>
            <span style={{ color: "var(--muted)", fontSize: "12px" }}>
              Current event
            </span>
            <select
              aria-label="Current event"
              defaultValue="event-1"
              style={{
                background: "transparent",
                border: "1px solid rgba(78, 70, 51, 0.8)",
                color: "var(--text)",
                minHeight: "48px",
                padding: "0 14px",
              }}
            >
              <option value="event-1">Neon Nights Festival - Main Gate</option>
              <option value="event-2">Neon Nights Festival - VIP Entrance</option>
            </select>
          </label>
        </section>

        <section
          aria-label="Scanner"
          style={{
            background: "#000",
            border: "1px solid rgba(78, 70, 51, 0.8)",
            display: "grid",
            gap: "20px",
            minHeight: "360px",
            placeItems: "center",
            padding: "24px",
          }}
        >
          <div
            style={{
              border: "4px solid rgba(255, 235, 192, 0.25)",
              display: "grid",
              height: "240px",
              placeItems: "center",
              position: "relative",
              width: "240px",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255, 235, 192, 0.8), rgba(255, 235, 192, 0.1))",
                height: "4px",
                insetInline: 0,
                position: "absolute",
                top: "0",
              }}
            />
            <span
              style={{
                color: "var(--accent-strong)",
                fontSize: "12px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}
            >
              Align QR within frame
            </span>
          </div>
          <p style={{ color: "var(--muted)", margin: 0, textAlign: "center" }}>
            Camera unavailable is handled by the manual fallback below.
          </p>
        </section>

        <section
          aria-label="Manual fallback"
          style={{
            background: "var(--surface-container)",
            border: "1px solid rgba(78, 70, 51, 0.8)",
            display: "grid",
            gap: "12px",
            padding: "18px",
          }}
        >
          <div
            style={{
              color: "var(--muted)",
              fontSize: "12px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            Manual override
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <input
              aria-label="Ticket credential"
              placeholder="Enter ticket code"
              style={{
                background: "transparent",
                border: "1px solid rgba(78, 70, 51, 0.8)",
                color: "var(--text)",
                flex: "1 1 220px",
                minHeight: "48px",
                padding: "0 14px",
              }}
            />
            <button
              type="button"
              style={{
                background: "var(--accent)",
                border: "none",
                color: "#121414",
                fontWeight: 700,
                minHeight: "48px",
                padding: "0 18px",
                textTransform: "uppercase",
              }}
            >
              Verify
            </button>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
