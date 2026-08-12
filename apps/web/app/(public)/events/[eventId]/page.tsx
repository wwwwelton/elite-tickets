import { notFound } from "next/navigation";

import { EventPoster } from "@/components/events/poster";
import { QuantityControl } from "@/components/events/quantity-control";
import type { PublicEvent } from "@/components/events/types";
import { LedgerRow, Status, Ticket } from "@/components/ui";
import { ApiError, apiRequest } from "@/lib/api";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "full",
  timeStyle: "short",
});
const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  let event: PublicEvent;
  try {
    event = await apiRequest<PublicEvent>(`/events/${encodeURIComponent(eventId)}`, {
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <main className="page-grid">
      <div className="hero-shell" style={{ gridColumn: "1 / -1" }}>
        <Ticket
          emphasized
          header={
            <>
              <EventPoster src={event.poster_url} alt={`Pôster de ${event.title}`} priority />
              <p className="label-caps">Evento publicado</p>
              <h1 className="display-lg">{event.title}</h1>
            </>
          }
          details={
            <ul className="ledger">
              <LedgerRow label="Início" value={dateFormatter.format(new Date(event.starts_at))} />
              <LedgerRow label="Término" value={dateFormatter.format(new Date(event.ends_at))} />
              <LedgerRow label="Local" value={event.venue_name} />
              <LedgerRow label="Capacidade" value={event.capacity} />
              <LedgerRow label="Preço unitário" value={moneyFormatter.format(Number(event.price))} />
              <LedgerRow label="Disponíveis" value={event.available_quantity} />
            </ul>
          }
          footer={
            <Status status={event.available_quantity > 0 ? "AVAILABLE" : "SOLD_OUT"} />
          }
        />
        <QuantityControl available={event.available_quantity} eventId={event.id} />
      </div>
    </main>
  );
}
