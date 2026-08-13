import { SiteShell } from "@/components/shell/site-shell";

export default function OrganizerNewEventPage() {
  return (
    <SiteShell
      title="Create Event"
      subtitle="Select a catalog title, review the imported information, and configure venue, time, capacity, and price."
    >
      <div
        style={{
          display: "grid",
          gap: "28px",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(320px, 0.8fr)",
        }}
      >
        <section style={{ display: "grid", gap: "24px" }}>
          <article
            aria-label="Select movie"
            style={{
              background: "var(--surface-container)",
              border: "1px solid rgba(78, 70, 51, 0.8)",
              display: "grid",
              gap: "18px",
              padding: "22px",
            }}
          >
            <div>
              <div
                style={{
                  color: "var(--muted)",
                  fontSize: "12px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                1. Select movie
              </div>
              <h2 style={{ margin: "8px 0 0", fontSize: "36px" }}>
                Choose a catalog title
              </h2>
            </div>
            <label style={{ display: "grid", gap: "10px" }}>
              <span
                style={{
                  color: "var(--muted)",
                  fontSize: "12px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                Search title or ID
              </span>
              <input
                defaultValue="Dune"
                aria-label="Catalog title search"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(78, 70, 51, 0.8)",
                  color: "var(--text)",
                  minHeight: "48px",
                  padding: "0 14px",
                }}
              />
            </label>
            <div
              style={{
                border: "1px solid rgba(78, 70, 51, 0.8)",
                display: "grid",
                gap: "14px",
                gridTemplateColumns: "96px minmax(0, 1fr) auto",
                padding: "16px",
              }}
            >
              <div
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255, 235, 192, 0.22), rgba(18, 20, 20, 0.92))",
                  minHeight: "128px",
                }}
              />
              <div style={{ display: "grid", gap: "8px" }}>
                <h3 style={{ margin: 0, fontSize: "28px" }}>Dune: Part Two</h3>
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  ID: MV-84920 | 166 MIN
                </p>
                <span
                  style={{
                    color: "var(--accent-strong)",
                    fontSize: "12px",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  Sci-Fi
                </span>
              </div>
              <div
                aria-hidden="true"
                style={{
                  alignSelf: "center",
                  color: "var(--accent-strong)",
                  fontSize: "20px",
                  fontWeight: 700,
                }}
              >
                Selected
              </div>
            </div>
          </article>

          <article
            aria-label="Logistics"
            style={{
              background: "var(--surface-container)",
              border: "1px solid rgba(78, 70, 51, 0.8)",
              display: "grid",
              gap: "18px",
              padding: "22px",
            }}
          >
            <div>
              <div
                style={{
                  color: "var(--muted)",
                  fontSize: "12px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                2. Logistics
              </div>
              <h2 style={{ margin: "8px 0 0", fontSize: "36px" }}>
                Schedule and pricing
              </h2>
            </div>
            <div
              style={{
                display: "grid",
                gap: "16px",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              }}
            >
              <label style={{ display: "grid", gap: "10px" }}>
                <span style={{ color: "var(--muted)", fontSize: "12px" }}>
                  Show date
                </span>
                <input
                  defaultValue="11/15/2026"
                  aria-label="Show date"
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(78, 70, 51, 0.8)",
                    color: "var(--text)",
                    minHeight: "48px",
                    padding: "0 14px",
                  }}
                />
              </label>
              <label style={{ display: "grid", gap: "10px" }}>
                <span style={{ color: "var(--muted)", fontSize: "12px" }}>
                  Show time
                </span>
                <input
                  defaultValue="19:30"
                  aria-label="Show time"
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(78, 70, 51, 0.8)",
                    color: "var(--text)",
                    minHeight: "48px",
                    padding: "0 14px",
                  }}
                />
              </label>
              <label style={{ display: "grid", gap: "10px" }}>
                <span style={{ color: "var(--muted)", fontSize: "12px" }}>
                  Venue
                </span>
                <input
                  defaultValue="TCL Chinese Theatre"
                  aria-label="Venue"
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(78, 70, 51, 0.8)",
                    color: "var(--text)",
                    minHeight: "48px",
                    padding: "0 14px",
                  }}
                />
              </label>
              <label style={{ display: "grid", gap: "10px" }}>
                <span style={{ color: "var(--muted)", fontSize: "12px" }}>
                  Capacity
                </span>
                <input
                  defaultValue="932"
                  aria-label="Capacity"
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(78, 70, 51, 0.8)",
                    color: "var(--text)",
                    minHeight: "48px",
                    padding: "0 14px",
                  }}
                />
              </label>
              <label style={{ display: "grid", gap: "10px" }}>
                <span style={{ color: "var(--muted)", fontSize: "12px" }}>
                  Price
                </span>
                <input
                  defaultValue="28.00"
                  aria-label="Price"
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(78, 70, 51, 0.8)",
                    color: "var(--text)",
                    minHeight: "48px",
                    padding: "0 14px",
                  }}
                />
              </label>
            </div>
          </article>
        </section>

        <aside
          aria-label="Live preview"
          style={{
            alignSelf: "start",
            background: "var(--surface-container)",
            border: "1px solid rgba(78, 70, 51, 0.8)",
            display: "grid",
            gap: "18px",
            padding: "20px",
          }}
        >
          <div>
            <div
              style={{
                color: "var(--muted)",
                fontSize: "12px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              Live preview
            </div>
            <h2 style={{ margin: "8px 0 0", fontSize: "28px" }}>Review card</h2>
          </div>
          <div
            style={{
              background: "linear-gradient(180deg, #1A2337 0%, #161d2f 100%)",
              border: "1px solid rgba(78, 70, 51, 0.8)",
              display: "grid",
              gap: "18px",
              padding: "20px",
            }}
          >
            <div
              style={{
                border: "1px solid var(--accent-strong)",
                color: "var(--accent-strong)",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.2em",
                padding: "6px 10px",
                width: "fit-content",
                textTransform: "uppercase",
              }}
            >
              IMAX 70MM
            </div>
            <h3 style={{ margin: 0, fontSize: "36px", lineHeight: 0.95 }}>
              Dune: Part Two
            </h3>
            <p style={{ color: "var(--muted)", margin: 0 }}>
              TCL Chinese Theatre
            </p>
            <div
              style={{
                borderTop: "1px dashed rgba(255, 235, 192, 0.5)",
                display: "grid",
                gap: "12px",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                paddingTop: "16px",
              }}
            >
              <div>
                <div style={{ color: "var(--muted)", fontSize: "12px" }}>Date</div>
                <div>Nov 15</div>
              </div>
              <div>
                <div style={{ color: "var(--muted)", fontSize: "12px" }}>Time</div>
                <div>19:30</div>
              </div>
              <div>
                <div style={{ color: "var(--muted)", fontSize: "12px" }}>
                  Section
                </div>
                <div>GA-1</div>
              </div>
            </div>
            <div
              style={{
                alignItems: "end",
                display: "flex",
                justifyContent: "space-between",
                gap: "20px",
              }}
            >
              <div>
                <div style={{ color: "var(--muted)", fontSize: "12px" }}>
                  Total
                </div>
                <div style={{ fontSize: "34px", fontWeight: 700 }}>$28.00</div>
              </div>
              <div
                aria-hidden="true"
                style={{
                  border: "2px solid var(--accent-strong)",
                  height: "72px",
                  width: "72px",
                }}
              />
            </div>
          </div>
          <a
            href="/organizer/events"
            style={{
              alignItems: "center",
              background: "var(--accent)",
              color: "#121414",
              display: "inline-flex",
              fontWeight: 700,
              justifyContent: "center",
              minHeight: "48px",
              padding: "12px 16px",
              textDecoration: "none",
              textTransform: "uppercase",
            }}
          >
            Publish
          </a>
        </aside>
      </div>
    </SiteShell>
  );
}
