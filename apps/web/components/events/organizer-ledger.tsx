"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { RouteAccessState } from "@/components/auth/route-access-state";
import { EventPoster } from "@/components/events/poster";
import { LedgerRow, Status, Ticket } from "@/components/ui";
import { ApiError, apiMutation, apiRequest } from "@/lib/api";
import { guardRoute } from "@/lib/auth";

type OrganizerEvent = {
  id: string;
  state: "DRAFT" | "PUBLISHED" | "CANCELLED" | "FINISHED";
  title: string;
  poster_url: string | null;
  starts_at: string;
  venue_name: string;
  capacity: number;
  reserved_quantity: number;
  sold_quantity: number;
  available_quantity: number;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function OrganizerLedger() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [events, setEvents] = useState<OrganizerEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [accessState, setAccessState] = useState<"auth_required" | "access_denied" | null>(null);

  useEffect(() => {
    const guard = guardRoute(["ORGANIZER"]);
    if (!guard.allowed) {
      setAccessState(guard.reason);
      return;
    }
    setAccessToken(guard.session.accessToken);
    void loadEvents(guard.session.accessToken, setEvents, setError);
  }, []);

  async function transition(event: OrganizerEvent, action: "publish" | "cancel") {
    if (!accessToken) return;
    setError(null);
    setPendingId(event.id);
    try {
      const updated = await apiMutation<OrganizerEvent>(
        `/events/${encodeURIComponent(event.id)}/${action}`,
        { accessToken },
      );
      setEvents((current) =>
        current?.map((candidate) => (candidate.id === updated.id ? updated : candidate)) ?? null,
      );
    } catch (caught) {
      setError(apiMessage(caught, "Não foi possível alterar o evento."));
    } finally {
      setPendingId(null);
    }
  }

  if (accessState === "auth_required") {
    return (
      <RouteAccessState
        title="Acesso necessário"
        message="Entre como organizador para ver seus eventos"
        actionHref="/login"
        actionLabel="Entrar"
      />
    );
  }
  if (accessState === "access_denied") {
    return (
      <RouteAccessState
        title="Acesso negado"
        message="Este painel pertence ao perfil do organizador"
        actionHref="/"
        actionLabel="Voltar ao início"
      />
    );
  }
  if (error && !events) return <p className="organizer-ledger__message" role="alert">{error}</p>;
  if (!events) return <p className="organizer-ledger__message" role="status">Carregando eventos…</p>;
  return (
    <section className="organizer-ledger organizer-responsive-ledger" aria-busy={pendingId !== null} aria-label="Inventário dos eventos">
      <div className="organizer-ledger__toolbar">
        <div>
          <p className="label-caps">Programação própria</p>
          <p className="body-md">Acompanhe publicação e estoque sem depender do catálogo externo.</p>
        </div>
        <Link className="button button--primary" href="/organizer/events/new">
          Criar evento
        </Link>
      </div>
      {error ? <p className="organizer-ledger__message" role="alert">{error}</p> : null}
      {events.length === 0 ? <p className="organizer-ledger__message" role="status">Nenhum evento criado.</p> : null}
      <div className="organizer-event-list">
        {events.map((event) => (
          <Ticket
            key={event.id}
            className="organizer-event-card"
            header={
              <>
                <EventPoster src={event.poster_url} alt={`Pôster de ${event.title}`} />
                <div className="ticket__header-copy">
                  <Status status={event.state} />
                  <h2 className="headline-sm">{event.title}</h2>
                  <p className="code-data">{dateFormatter.format(new Date(event.starts_at))}</p>
                </div>
              </>
            }
            details={
              <>
                <ul className="ledger">
                  <LedgerRow label="Local" value={event.venue_name} />
                  <LedgerRow label="Capacidade" value={event.capacity} />
                </ul>
                <Inventory event={event} />
              </>
            }
            footer={
              event.state === "DRAFT" ? (
                <button type="button" disabled={pendingId === event.id} onClick={() => transition(event, "publish")}>
                  {pendingId === event.id ? "Publicando…" : "Publicar"}
                </button>
              ) : event.state === "PUBLISHED" ? (
                <button type="button" className="button button--ghost" disabled={pendingId === event.id} onClick={() => transition(event, "cancel")}>
                  {pendingId === event.id ? "Cancelando…" : "Cancelar evento"}
                </button>
              ) : undefined
            }
          />
        ))}
      </div>
    </section>
  );
}

function Inventory({ event }: { event: OrganizerEvent }) {
  const soldPercentage = Math.round((event.sold_quantity / event.capacity) * 100);

  return (
    <section className="organizer-inventory" aria-label={`Estoque de ${event.title}`}>
      <div className="organizer-inventory__heading">
        <span className="label-caps">Inventário</span>
        <span className="code-data">{soldPercentage}% vendido</span>
      </div>
      <progress
        className="organizer-inventory__progress"
        aria-label={`${event.sold_quantity} de ${event.capacity} ingressos vendidos`}
        max={event.capacity}
        value={event.sold_quantity}
      />
      <ul className="ledger organizer-inventory__counts">
        <LedgerRow label="Vendidos" value={event.sold_quantity} />
        <LedgerRow label="Reservados" value={event.reserved_quantity} />
        <LedgerRow label="Disponíveis" value={event.available_quantity} />
      </ul>
    </section>
  );
}

async function loadEvents(
  accessToken: string,
  setEvents: (events: OrganizerEvent[]) => void,
  setError: (message: string) => void,
) {
  try {
    setEvents(
      await apiRequest<OrganizerEvent[]>("/organizer/events", {
        accessToken,
        cache: "no-store",
      }),
    );
  } catch (caught) {
    setError(apiMessage(caught, "Não foi possível carregar os eventos."));
  }
}

function apiMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}
