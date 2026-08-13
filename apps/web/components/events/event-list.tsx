import type { PublicEventApi } from "@/lib/api";
import { EventCard } from "./event-card";

export function EventList({ events }: { events: PublicEventApi[] }) {
  return (
    <ul
      className="list-unstyled row row-cols-2 row-cols-md-3 row-cols-xl-4 g-3 mb-0"
      aria-label="Event results"
    >
      {events.map((event) => (
        <li className="col" key={event.id}>
          <EventCard event={event} />
        </li>
      ))}
    </ul>
  );
}
