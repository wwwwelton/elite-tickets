import { EventCard } from "@/components/events/event-card";
import type { PublicEvent } from "@/components/events/types";

export function EventList({ events }: { events: PublicEvent[] }) {
  if (events.length === 0) {
    return (
      <section className="page-grid event-list event-list--empty" aria-label="Eventos publicados">
        <p className="label-caps" role="status">Nenhum evento publicado encontrado.</p>
      </section>
    );
  }
  return (
    <section className="page-grid event-grid event-list" aria-label="Eventos publicados">
      {events.map((event, index) => (
        <EventCard key={event.id} event={event} priority={index === 0} />
      ))}
    </section>
  );
}
