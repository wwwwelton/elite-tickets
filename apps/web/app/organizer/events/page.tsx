import { SiteShell } from "@/components/shell/site-shell";
import {
  cancelOrganizerEvent,
  createOrganizerEvent,
  fetchCatalogEventDetail,
  fetchCatalogEvents,
  fetchOrganizerEvents,
  publishOrganizerEvent,
} from "@/lib/api";

const organizerApiSurface = {
  cancelOrganizerEvent,
  createOrganizerEvent,
  fetchCatalogEventDetail,
  fetchCatalogEvents,
  fetchOrganizerEvents,
  publishOrganizerEvent,
};

const organizerEvents = [
  {
    id: "event-1",
    status: "LIVE",
    title: "Neon Nights Festival",
    startsAt: "OCT 24 • 9:00 PM",
    sold: "4,250",
    available: "750",
  },
  {
    id: "event-2",
    status: "SOLD OUT",
    title: "Underground Sessions",
    startsAt: "NOV 02 • 11:00 PM",
    sold: "1,500",
    available: "0",
  },
  {
    id: "event-3",
    status: "DRAFT",
    title: "Modern Art Expo",
    startsAt: "TBD",
    sold: "0",
    available: "---",
  },
];

export default function OrganizerEventsPage() {
  void organizerApiSurface;

  return (
    <SiteShell
      title="Dashboard"
      subtitle="Active event overview."
    >
      <div
        style={{
          display: "grid",
          gap: "24px",
        }}
      >
        <div
          style={{
            alignItems: "center",
            borderBottom: "1px solid rgba(78, 70, 51, 0.8)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: "18px",
            paddingBottom: "18px",
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
              Organizer Studio
            </div>
            <p style={{ margin: "10px 0 0", maxWidth: "56ch" }}>
              Manage live, sold out, and draft events from one desktop-first
              overview.
            </p>
          </div>
          <a
            href="/organizer/events/new"
            style={{
              alignItems: "center",
              background: "var(--accent)",
              borderRadius: "0",
              color: "#121414",
              display: "inline-flex",
              fontWeight: 700,
              minHeight: "48px",
              padding: "14px 22px",
              textDecoration: "none",
              textTransform: "uppercase",
            }}
          >
            Create new event
          </a>
        </div>

        <section
          aria-label="Organizer events overview"
          style={{
            display: "grid",
            gap: "18px",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          }}
        >
          {organizerEvents.map((event) => (
            <article
              key={event.id}
              style={{
                background: "linear-gradient(180deg, #1A2337 0%, #161d2f 100%)",
                border: "1px solid rgba(78, 70, 51, 0.8)",
                display: "grid",
                minHeight: "340px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  alignItems: "start",
                  background:
                    "linear-gradient(135deg, rgba(255, 235, 192, 0.16), rgba(18, 20, 20, 0.88))",
                  display: "flex",
                  justifyContent: "space-between",
                  minHeight: "180px",
                  padding: "18px",
                }}
              >
                <span
                  style={{
                    border: "1px solid currentColor",
                    color: "var(--accent-strong)",
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    padding: "4px 10px",
                    textTransform: "uppercase",
                  }}
                >
                  {event.status}
                </span>
              </div>
                <div style={{ display: "grid", gap: "14px", padding: "20px" }}>
                  <h2 style={{ margin: 0, fontSize: "32px", lineHeight: 0.95 }}>
                    {event.title}
                  </h2>
                  <p style={{ color: "var(--muted)", margin: 0 }}>{event.startsAt}</p>
                <div
                  style={{
                    borderTop: "1px dashed rgba(255, 235, 192, 0.5)",
                    display: "grid",
                    gap: "12px",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    paddingTop: "16px",
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
                      Sold
                    </div>
                    <div style={{ fontSize: "28px", marginTop: "6px" }}>
                      {event.sold}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        color: "var(--muted)",
                        fontSize: "12px",
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                      }}
                    >
                      Available
                    </div>
                    <div style={{ fontSize: "28px", marginTop: "6px" }}>
                      {event.available}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                    padding: "0 20px 20px",
                  }}
                >
                  <a
                    href="/organizer/events/new"
                    style={{
                      border: "1px solid rgba(255, 235, 192, 0.7)",
                      color: "var(--accent-strong)",
                      fontWeight: 700,
                      minHeight: "44px",
                      padding: "10px 14px",
                      textDecoration: "none",
                      textTransform: "uppercase",
                    }}
                  >
                    Publish
                  </a>
                  <a
                    href="/organizer/events/new"
                    style={{
                      border: "1px solid rgba(78, 70, 51, 0.8)",
                      fontWeight: 700,
                      minHeight: "44px",
                      padding: "10px 14px",
                      textDecoration: "none",
                      textTransform: "uppercase",
                    }}
                  >
                    Cancel
                  </a>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </SiteShell>
  );
}
