"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StudioShell } from "@/components/shell/studio-shell";
import { RequireRole } from "@/components/shell/require-role";
import { EmptyState, ErrorState, LoadingState } from "@/components/states/states";
import {
  ApiError,
  cancelOrganizerEvent,
  fetchOrganizerEvents,
  publishOrganizerEvent,
  type OrganizerEventApi,
} from "@/lib/api";
import { formatDate, formatMoney, formatTime } from "@/lib/format";

export default function OrganizerEventsPage() {
  return (
    <StudioShell
      eyebrow="Organizer studio"
      title="Dashboard"
      action={
        <Link className="btn btn-primary" href="/organizer/events/new">
          Create new event
        </Link>
      }
    >
      <RequireRole role="ORGANIZER">
        <OrganizerEvents />
      </RequireRole>
    </StudioShell>
  );
}

function OrganizerEvents() {
  const [events, setEvents] = useState<OrganizerEventApi[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    setEvents(null);
    fetchOrganizerEvents()
      .then(setEvents)
      .catch(() => setError("Your events could not be loaded."));
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
          : "The action could not be completed.",
      );
    } finally {
      setBusyId(null);
    }
  }

  if (error) {
    return <ErrorState description={error} onRetry={load} />;
  }

  if (!events) {
    return <LoadingState label="Loading your events" />;
  }

  if (events.length === 0) {
    return (
      <EmptyState
        title="No events yet"
        description="Create an event from the external catalog to start selling."
        action={
          <Link className="btn btn-primary" href="/organizer/events/new">
            Create new event
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
        {events.map((event) => (
          <li className="col" key={event.id}>
            <article className="card h-100">
              {event.poster_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="poster poster--wide" src={event.poster_url} alt="" />
              ) : (
                <div className="poster poster--wide" />
              )}

              <div className="card-body d-grid gap-2">
                <span className="badge text-cream">{event.state}</span>
                <h2 className="h4 text-cream mb-0">{event.title}</h2>
                <p className="font-mono small text-secondary mb-0">
                  {formatDate(event.starts_at)} · {formatTime(event.starts_at)}
                </p>
                <p className="font-mono small text-secondary mb-0">
                  {event.venue_name}
                </p>

                <dl className="row border-top pt-2 mb-0">
                  <dt className="col-6 eyebrow">Sold</dt>
                  <dd className="col-6 eyebrow text-end mb-0">Available</dd>
                  <dd className="col-6 h4 mb-0">{event.sold_quantity}</dd>
                  <dd className="col-6 h4 text-end mb-0">
                    {event.available_quantity}
                  </dd>
                </dl>

                <p className="font-mono mb-0">{formatMoney(event.price)}</p>

                <div className="d-flex gap-2 flex-wrap">
                  <button
                    className="btn btn-outline-light btn-sm"
                    type="button"
                    disabled={busyId === event.id}
                    onClick={() => runAction(event.id, publishOrganizerEvent)}
                  >
                    Publish
                  </button>
                  <button
                    className="btn btn-outline-light btn-sm text-danger"
                    type="button"
                    disabled={busyId === event.id}
                    onClick={() => runAction(event.id, cancelOrganizerEvent)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
