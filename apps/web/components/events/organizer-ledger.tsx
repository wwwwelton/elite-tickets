"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { LedgerRow, Status, Ticket } from "@/components/ui";
import { ApiError, apiMutation, apiRequest } from "@/lib/api";
import { guardRoute } from "@/lib/auth";

type OrganizerEvent = {
  id: string;
  state: "DRAFT" | "PUBLISHED" | "CANCELLED" | "FINISHED";
  title: string;
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
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [events, setEvents] = useState<OrganizerEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    const guard = guardRoute(["ORGANIZER"]);
    if (!guard.allowed) {
      router.replace(guard.redirectTo);
      return;
    }
    setAccessToken(guard.session.accessToken);
    void loadEvents(guard.session.accessToken, setEvents, setError);
  }, [router]);

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

  if (error && !events) return <p role="alert">{error}</p>;
  if (!events) return <p role="status">Carregando eventos…</p>;
  return (
    <section aria-busy={pendingId !== null}>
      {error ? <p role="alert">{error}</p> : null}
      <Link className="button button--primary" href="/organizer/events/new">
        Criar evento
      </Link>
      {events.length === 0 ? <p role="status">Nenhum evento criado.</p> : null}
      <div className="page-grid" style={{ width: "100%" }}>
        {events.map((event) => (
          <Ticket
            key={event.id}
            header={
              <>
                <Status status={event.state} />
                <h2 className="headline-sm">{event.title}</h2>
              </>
            }
            details={
              <ul className="ledger">
                <LedgerRow label="Sessão" value={dateFormatter.format(new Date(event.starts_at))} />
                <LedgerRow label="Local" value={event.venue_name} />
                <LedgerRow label="Capacidade" value={event.capacity} />
                <LedgerRow label="Vendidos" value={event.sold_quantity} />
                <LedgerRow label="Reservados" value={event.reserved_quantity} />
                <LedgerRow label="Disponíveis" value={event.available_quantity} />
              </ul>
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
