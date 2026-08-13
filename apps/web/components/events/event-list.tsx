import type { EventSummary } from "@/lib/mappers";
import { EventCard } from "./event-card";

type EventListProps = {
  events: EventSummary[];
};

export function EventList({ events }: EventListProps) {
  return (
    <ul
      aria-label="Event results"
      style={{
        display: "grid",
        gap: "16px",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        listStyle: "none",
        padding: 0,
        margin: 0,
      }}
    >
      {events.map((event) => (
        <li key={event.id}>
          <EventCard event={event} />
        </li>
      ))}
    </ul>
  );
}
