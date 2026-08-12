import { EventCard } from "@/components/events/event-card";
import type { PublicEvent } from "@/components/events/types";
import { StateMessage } from "@/components/ui";

export function EventList({ events }: { events: PublicEvent[] }) {
  if (events.length === 0) {
    return (
      <section className="page-grid event-list event-list--empty" aria-label="Eventos publicados">
        <StateMessage className="label-caps">
          Nenhum evento publicado encontrado.
        </StateMessage>
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
