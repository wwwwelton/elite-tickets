import { SiteShell } from "@/components/shell/site-shell";
import { LoadingState } from "@/components/states/loading-state";

const featuredEvents = [
  {
    id: "event-1",
    title: "Neon Horizon",
    starts_at: "2026-09-10T20:00:00Z",
    venue_name: "Grand Cinema",
  },
];

export default function HomePage() {
  return (
    <SiteShell
      title="Discover events"
      subtitle="Browse the nearest upcoming public events and start your ticket journey."
    >
      <section
        style={{
          display: "grid",
          gap: "18px",
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                color: "var(--muted)",
                fontSize: "13px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              Upcoming
            </div>
            <h2 style={{ margin: "6px 0 0", fontSize: "28px" }}>
              Events near you
            </h2>
          </div>
          <div
            style={{
              border: "1px solid rgba(78, 70, 51, 0.75)",
              borderRadius: "9999px",
              color: "var(--accent-strong)",
              fontSize: "13px",
              padding: "10px 14px",
            }}
          >
            Search, login, and register flows coming next
          </div>
        </div>

        <LoadingState label="Loading events" />

        <div
          style={{
            display: "grid",
            gap: "16px",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          }}
        >
          {featuredEvents.map((event) => (
            <article
              key={event.id}
              style={{
                background: "var(--surface)",
                border: "1px solid rgba(78, 70, 51, 0.8)",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                minHeight: "260px",
              }}
            >
              <div
                style={{
                  aspectRatio: "4 / 5",
                  background:
                    "linear-gradient(135deg, rgba(243,192,25,0.35), rgba(35,38,38,0.95))",
                  borderBottom: "1px solid rgba(78, 70, 51, 0.8)",
                }}
              />
              <div style={{ padding: "18px" }}>
                <div
                  style={{
                    color: "var(--muted)",
                    fontSize: "12px",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                  }}
                >
                  {event.venue_name}
                </div>
                <h3 style={{ margin: "8px 0 0", fontSize: "24px" }}>
                  {event.title}
                </h3>
                <p style={{ color: "var(--muted)", margin: "10px 0 0" }}>
                  {event.starts_at}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
