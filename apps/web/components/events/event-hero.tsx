import type { PublicEventApi } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/format";

export function EventHero({ event }: { event: PublicEventApi }) {
  return (
    <header className="position-relative border-bottom">
      {event.poster_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="hero-media" src={event.poster_url} alt="" />
      ) : (
        <div className="hero-media poster poster--wide" />
      )}
      <div className="hero-overlay position-absolute bottom-0 start-0 end-0 p-3 p-lg-4">
        <div className="container px-0">
          <p className="eyebrow mb-1">
            {formatDate(event.starts_at)} · {formatTime(event.starts_at)}
          </p>
          <h1 className="display-3 text-cream mb-1">{event.title}</h1>
          <p className="font-mono text-secondary mb-0">
            {event.venue_name ?? "Local a confirmar"}
          </p>
        </div>
      </div>
    </header>
  );
}
