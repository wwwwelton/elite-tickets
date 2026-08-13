import Link from "next/link";
import type { TicketApi } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/format";

export function TicketCard({
  ticket,
  eventTitle,
  venueName,
  startsAt,
}: {
  ticket: TicketApi;
  eventTitle: string;
  venueName?: string;
  startsAt?: string;
}) {
  const inactive = ticket.status !== "ACTIVE";

  return (
    <Link
      className={`stub text-decoration-none d-block ${inactive ? "stub--muted" : ""}`}
      href={`/customer/tickets/${ticket.id}`}
    >
      <div className="p-3 d-grid gap-2">
        <div className="d-flex justify-content-between align-items-start gap-2">
          <h3 className="h4 text-cream mb-0">{eventTitle}</h3>
          <span className={`badge ${inactive ? "text-secondary" : "text-cream"}`}>
            {ticket.status}
          </span>
        </div>
        <p className="font-mono small text-secondary mb-0">
          {venueName ?? "Venue to confirm"}
        </p>
      </div>

      <div className="perf d-flex align-items-center px-3">
        <span className="perf__line flex-grow-1" aria-hidden="true" />
      </div>

      <div className="p-3 d-flex justify-content-between gap-3">
        <span>
          <span className="eyebrow d-block">Date</span>
          <span className="font-mono">{formatDate(startsAt)}</span>
        </span>
        <span>
          <span className="eyebrow d-block">Time</span>
          <span className="font-mono">{formatTime(startsAt)}</span>
        </span>
        <span className="text-end">
          <span className="eyebrow d-block">Ticket</span>
          <span className="font-mono">{ticket.id.slice(0, 8)}</span>
        </span>
      </div>
    </Link>
  );
}
