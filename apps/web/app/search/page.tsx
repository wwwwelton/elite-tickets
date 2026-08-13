import { AppShell } from "@/components/shell/app-shell";
import { EventList } from "@/components/events/event-list";
import { EventSearch } from "@/components/events/event-search";
import { EmptyState, ErrorState } from "@/components/states/states";
import { fetchPublicEvents, type PublicEventApi } from "@/lib/api";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<{ query?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { query = "" } = await searchParams;

  let events: PublicEventApi[] = [];
  let failed = false;

  try {
    events = (await fetchPublicEvents({ query })).items;
  } catch {
    failed = true;
  }

  return (
    <AppShell>
      <div className="container py-4 d-grid gap-4">
        <div className="d-grid gap-2">
          <p className="eyebrow mb-0">Search</p>
          <h1 className="h2 text-cream mb-0">
            {query ? `Results for “${query}”` : "Browse every published event"}
          </h1>
        </div>

        <EventSearch initialValue={query} autoFocus />

        {failed ? (
          <ErrorState description="The search could not be completed. Try again in a moment." />
        ) : events.length === 0 ? (
          <EmptyState
            title="No matching events"
            description="Try a different title, venue, or clear the search to see everything on sale."
          />
        ) : (
          <>
            <p className="eyebrow mb-0">{events.length} result(s)</p>
            <EventList events={events} />
          </>
        )}
      </div>
    </AppShell>
  );
}
