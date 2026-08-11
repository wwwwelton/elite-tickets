import { EventList } from "@/components/events/event-list";
import type { PublicEventPage } from "@/components/events/types";
import { ApiError, apiRequest } from "@/lib/api";

type HomeProps = {
  searchParams: Promise<{ page?: string | string[]; query?: string | string[] }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const values = await searchParams;
  const query = typeof values.query === "string" ? values.query : "";
  const requestedPage = typeof values.page === "string" ? Number(values.page) : 1;
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const params = new URLSearchParams({ page: String(page) });
  if (query) params.set("query", query);

  try {
    const events = await apiRequest<PublicEventPage>(`/events?${params}`, {
      cache: "no-store",
    });
    return (
      <main>
        <section className="page-grid">
          <div style={{ gridColumn: "1 / -1" }}>
            <p className="label-caps">EliteTickets</p>
            <h1 className="display-lg">Sessões em cartaz</h1>
            <form action="/" method="get" className="field">
              <label htmlFor="event-search">Filme ou local</label>
              <input
                id="event-search"
                name="query"
                type="search"
                defaultValue={query}
                maxLength={200}
              />
              <button type="submit">Pesquisar</button>
            </form>
            <p className="code-data">{events.total} evento(s)</p>
          </div>
        </section>
        <EventList events={events.items} />
      </main>
    );
  } catch (error) {
    const message =
      error instanceof ApiError ? error.message : "Não foi possível carregar os eventos.";
    return (
      <main className="page-grid">
        <div role="alert" style={{ gridColumn: "1 / -1" }}>
          <h1 className="headline-md">Eventos indisponíveis</h1>
          <p>{message}</p>
        </div>
      </main>
    );
  }
}
