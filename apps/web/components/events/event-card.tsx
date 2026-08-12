import Link from "next/link";

import { EventPoster } from "@/components/events/poster";
import type { PublicEvent } from "@/components/events/types";
import { LedgerRow, Status, Ticket } from "@/components/ui";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
});
const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function EventCard({ event, priority = false }: { event: PublicEvent; priority?: boolean }) {
  const available = event.available_quantity > 0;
  return (
    <Ticket
      header={
        <>
          <EventPoster src={event.poster_url} alt={`Pôster de ${event.title}`} priority={priority} />
          <div className="ticket__header-copy">
            <p className="label-caps">Sessão em cartaz</p>
            <h2 className="headline-sm">{event.title}</h2>
          </div>
        </>
      }
      details={
        <ul className="ledger">
          <LedgerRow label="Data" value={dateFormatter.format(new Date(event.starts_at))} />
          <LedgerRow label="Local" value={event.venue_name} />
          <LedgerRow label="Preço" value={moneyFormatter.format(Number(event.price))} />
          <LedgerRow label="Disponíveis" value={event.available_quantity} />
        </ul>
      }
      footer={
        <div className="ticket__actions">
          <Status status={available ? "AVAILABLE" : "SOLD_OUT"} />
          <Link className="button button--ghost" href={`/events/${event.id}`}>
            Ver evento
          </Link>
        </div>
      }
    />
  );
}
