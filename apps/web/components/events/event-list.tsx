import { EventCard } from "@/components/events/event-card";
import type { PublicEvent } from "@/components/events/types";

export function EventList({ events }: { events: PublicEvent[] }) {
  if (events.length === 0) {
    return <p className="page-grid" role="status">Nenhum evento publicado encontrado.</p>;
  }
  return (
    <div className="page-grid event-grid">
      {events.map((event, index) => (
        <EventCard key={event.id} event={event} priority={index === 0} />
      ))}
    </div>
  );
}
