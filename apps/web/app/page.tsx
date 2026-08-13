import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { EventCard } from "@/components/events/event-card";
import { EventList } from "@/components/events/event-list";
import { EventSearch } from "@/components/events/event-search";
import { EmptyState, ErrorState } from "@/components/states/states";
import { fetchPublicEvents, type PublicEventApi } from "@/lib/api";

export const dynamic = "force-dynamic";

async function loadEvents() {
  try {
    const page = await fetchPublicEvents();
    return { events: page.items, failed: false };
  } catch {
    return { events: [] as PublicEventApi[], failed: true };
  }
}

export default async function HomePage() {
  const { events, failed } = await loadEvents();
  const featured = events.slice(0, 5);
  const rest = events.slice(5);

  return (
    <AppShell>
      <div className="container py-4 d-grid gap-4">
        <EventSearch />

        {failed ? (
          <ErrorState description="The event catalog is unavailable right now. Refresh the page to try again." />
        ) : events.length === 0 ? (
          <EmptyState
            title="No published events yet"
            description="As soon as an organizer publishes an event it shows up here, nearest date first."
          />
        ) : (
          <>
            <section className="d-grid gap-3">
              <div className="d-flex justify-content-between align-items-baseline border-bottom pb-2">
                <h2 className="h4 text-cream mb-0">Now on sale</h2>
                <span className="eyebrow mb-0">Nearest dates first</span>
              </div>
              <div className="rail pb-2">
                {featured.map((event) => (
                  <EventCard key={event.id} event={event} badge="On sale" />
                ))}
              </div>
            </section>

            {rest.length > 0 ? (
              <section className="d-grid gap-3">
                <div className="d-flex justify-content-between align-items-baseline border-bottom pb-2">
                  <h2 className="h4 text-cream mb-0">All events</h2>
                  <Link className="eyebrow text-cream mb-0" href="/search">
                    View all
                  </Link>
                </div>
                <EventList events={rest} />
              </section>
            ) : null}
          </>
        )}
      </div>
    </AppShell>
  );
}
