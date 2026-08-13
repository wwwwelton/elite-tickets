import Link from "next/link";
import type { PublicEventApi } from "@/lib/api";
import { availabilityOf } from "@/lib/availability";
import { formatMoney, formatShortDate, formatTime } from "@/lib/format";

export function EventCard({
  event,
  badge,
}: {
  event: PublicEventApi;
  badge?: string;
}) {
  const availability = availabilityOf(event);
  const flag = availability.soldOut
    ? "Esgotado"
    : availability.lowStock
      ? "Últimos ingressos"
      : badge;

  return (
    <Link
      className="card h-100 bg-navy text-decoration-none"
      href={`/events/${event.id}`}
    >
      <div className="position-relative">
        {event.poster_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="poster" src={event.poster_url} alt="" />
        ) : (
          <div className="poster d-grid align-content-center text-center p-3">
            <span className="h4 text-cream mb-0">{event.title}</span>
          </div>
        )}
        {flag ? (
          <span
            className={`badge position-absolute top-0 start-0 m-2 border-0 ${
              availability.soldOut ? "bg-danger text-white" : "bg-warning text-dark"
            }`}
          >
            {flag}
          </span>
        ) : null}
      </div>
      <div className="card-body d-grid gap-1">
        <p className="eyebrow mb-0">{event.venue_name ?? "Local a confirmar"}</p>
        <h3 className="h5 text-cream mb-0">{event.title}</h3>
        <div className="d-flex justify-content-between align-items-baseline">
          <span className="font-mono small text-secondary">
            {formatShortDate(event.starts_at)} · {formatTime(event.starts_at)}
          </span>
          <span className="font-mono text-cream">{formatMoney(event.price)}</span>
        </div>
      </div>
    </Link>
  );
}
