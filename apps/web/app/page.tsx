import { SiteShell } from "@/components/shell/site-shell";
import { LoadingState } from "@/components/states/loading-state";
import { EventList } from "@/components/events/event-list";
import { EventSearch } from "@/components/events/event-search";
import { fetchPublicEvents } from "@/lib/api";
import { mapEventSummary } from "@/lib/mappers";

export default async function HomePage() {
  const featuredEvents = (await fetchPublicEvents()).items
    .map(mapEventSummary)
    .sort((left, right) =>
      (left.startsAt ?? "").localeCompare(right.startsAt ?? ""),
    );

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

        <EventSearch />

        <LoadingState label="Loading events" />

        <EventList events={featuredEvents} />
      </section>
    </SiteShell>
  );
}
