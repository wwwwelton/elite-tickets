import type { PublicEventApi } from "@/lib/api";
import { availabilityOf } from "@/lib/availability";
import { formatDate, formatMoney, formatTime } from "@/lib/format";
import { isSeatedVenue } from "@/lib/seating";

export function EventDetail({ event }: { event: PublicEventApi }) {
  const seated = isSeatedVenue(event);
  const availability = availabilityOf(event);

  return (
    <section className="d-grid gap-4" aria-label="Event details">
      <dl className="row row-cols-2 row-cols-md-4 g-3 mb-0">
        <Fact label="Date" value={formatDate(event.starts_at)} />
        <Fact label="Time" value={formatTime(event.starts_at)} />
        <Fact label="Venue" value={event.venue_name ?? "To confirm"} />
        <Fact label="Availability" value={availability.label} />
      </dl>

      {event.overview ? (
        <div className="d-grid gap-2">
          <h2 className="h4 text-cream border-start border-4 border-warning ps-3 mb-0">
            Synopsis
          </h2>
          <p className="mb-0">{event.overview}</p>
        </div>
      ) : null}

      <div className="d-flex flex-wrap gap-2">
        <span className="badge text-cream">
          {seated ? "Assigned seating" : "Sectors"}
        </span>
        <span className="badge text-secondary">Simulated payment</span>
        {availability.soldOut ? (
          <span className="badge text-danger">Sold out</span>
        ) : availability.lowStock ? (
          <span className="badge text-warning">Last tickets</span>
        ) : null}
      </div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="col">
      <dt className="eyebrow mb-1">{label}</dt>
      <dd className="font-mono mb-0">{value}</dd>
    </div>
  );
}
