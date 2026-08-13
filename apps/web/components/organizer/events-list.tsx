"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/states/states";
import {
  ApiError,
  cancelOrganizerEvent,
  fetchOrganizerEvents,
  publishOrganizerEvent,
  type OrganizerEventApi,
} from "@/lib/api";
import { formatDate, formatMoney, formatTime } from "@/lib/format";

export function OrganizerEventsList({ onlyMine = false }: { onlyMine?: boolean }) {
  const [events, setEvents] = useState<OrganizerEventApi[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    setEvents(null);
    fetchOrganizerEvents()
      .then(setEvents)
      .catch(() => setError("Os eventos não puderam ser carregados."));
  }, []);

  useEffect(load, [load]);

  async function runAction(
    eventId: string,
    action: (id: string) => Promise<OrganizerEventApi>,
  ) {
    setBusyId(eventId);
    setActionError(null);
    try {
      const updated = await action(eventId);
      setEvents((current) =>
        current?.map((event) => (event.id === updated.id ? updated : event)) ?? null,
      );
    } catch (caught) {
      setActionError(
        caught instanceof ApiError
          ? caught.message
          : "A ação não pôde ser concluída.",
      );
    } finally {
      setBusyId(null);
    }
  }

  if (error) {
    return <ErrorState description={error} onRetry={load} />;
  }

  if (!events) {
    return <LoadingState label="Carregando eventos" />;
  }

  const visible = onlyMine ? events.filter((event) => event.is_owner) : events;

  if (visible.length === 0) {
    return (
      <EmptyState
        title={onlyMine ? "Você ainda não criou eventos" : "Ainda não há eventos"}
        description={
          onlyMine
            ? "Crie um evento a partir do catálogo externo para vê-lo aqui."
            : "Nenhum organizador criou um evento ainda. Crie um a partir do catálogo externo para começar a vender."
        }
        action={
          <Link className="btn btn-primary" href="/organizer/events/new">
            Criar novo evento
          </Link>
        }
      />
    );
  }

  return (
    <div className="d-grid gap-3">
      {actionError ? (
        <div className="alert alert-danger mb-0" role="alert">
          {actionError}
        </div>
      ) : null}

      <ul className="list-unstyled row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3 mb-0">
        {visible.map((event) => (
          <li className="col" key={event.id}>
            <article className="card h-100">
              {event.poster_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="poster poster--wide" src={event.poster_url} alt="" />
              ) : (
                <div className="poster poster--wide" />
              )}

              <div className="card-body d-grid gap-2">
                <div className="d-flex gap-2 flex-wrap">
                  <span className="badge text-cream">{event.state}</span>
                  {!event.is_owner ? (
                    <span className="badge bg-secondary">Outro organizador</span>
                  ) : null}
                </div>
                <h2 className="h4 text-cream mb-0">{event.title}</h2>
                <p className="font-mono small text-secondary mb-0">
                  {formatDate(event.starts_at)} · {formatTime(event.starts_at)}
                </p>
                <p className="font-mono small text-secondary mb-0">
                  {event.venue_name}
                </p>

                <dl className="row border-top pt-2 mb-0">
                  <dt className="col-6 eyebrow">Vendidos</dt>
                  <dd className="col-6 eyebrow text-end mb-0">Disponíveis</dd>
                  <dd className="col-6 h4 mb-0">{event.sold_quantity}</dd>
                  <dd className="col-6 h4 text-end mb-0">
                    {event.available_quantity}
                  </dd>
                </dl>

                <p className="font-mono mb-0">{formatMoney(event.price)}</p>

                {event.is_owner ? (
                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      className="btn btn-outline-light btn-sm"
                      type="button"
                      disabled={busyId === event.id}
                      onClick={() => runAction(event.id, publishOrganizerEvent)}
                    >
                      Publicar
                    </button>
                    <button
                      className="btn btn-outline-light btn-sm text-danger"
                      type="button"
                      disabled={busyId === event.id}
                      onClick={() => runAction(event.id, cancelOrganizerEvent)}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
