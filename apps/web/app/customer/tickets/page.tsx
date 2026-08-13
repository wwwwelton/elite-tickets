"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { RequireRole } from "@/components/shell/require-role";
import { TicketCard } from "@/components/tickets/ticket-card";
import { EmptyState, ErrorState, LoadingState } from "@/components/states/states";
import {
  fetchMyTickets,
  fetchPublicEvent,
  type PublicEventApi,
  type TicketApi,
} from "@/lib/api";

export default function MyTicketsPage() {
  return (
    <AppShell>
      <div className="container py-4">
        <RequireRole role="CUSTOMER">
          <TicketsList />
        </RequireRole>
      </div>
    </AppShell>
  );
}

function TicketsList() {
  const [tickets, setTickets] = useState<TicketApi[] | null>(null);
  const [events, setEvents] = useState<Record<string, PublicEventApi>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    setTickets(null);

    fetchMyTickets()
      .then(async (list) => {
        setTickets(list);
        const uniqueIds = [...new Set(list.map((ticket) => ticket.event_id))];
        const resolved = await Promise.all(
          uniqueIds.map((id) =>
            fetchPublicEvent(id)
              .then((event) => [id, event] as const)
              .catch(() => null),
          ),
        );
        setEvents(
          Object.fromEntries(resolved.filter((entry) => entry !== null)),
        );
      })
      .catch(() => setError("Seus ingressos não puderam ser carregados."));
  }, []);

  useEffect(load, [load]);

  if (error) {
    return <ErrorState description={error} onRetry={load} />;
  }

  if (!tickets) {
    return <LoadingState label="Carregando seus ingressos" />;
  }

  if (tickets.length === 0) {
    return (
      <EmptyState
        title="Ainda não há ingressos"
        description="Assim que um pagamento for aprovado, seus ingressos aparecerão aqui, do mais recente para o mais antigo."
        action={
          <Link className="btn btn-primary" href="/">
            Encontrar um evento
          </Link>
        }
      />
    );
  }

  return (
    <div className="d-grid gap-3">
      <h1 className="display-5 text-cream mb-0">Meus ingressos</h1>
      <ul className="list-unstyled row row-cols-1 row-cols-md-2 g-3 mb-0">
        {tickets.map((ticket) => {
          const event = events[ticket.event_id];
          return (
            <li className="col" key={ticket.id}>
              <TicketCard
                ticket={ticket}
                eventTitle={event?.title ?? "Evento"}
                venueName={event?.venue_name}
                startsAt={event?.starts_at}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
