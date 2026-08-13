"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { RequireRole } from "@/components/shell/require-role";
import { QrCode } from "@/components/tickets/qr-code";
import { EmptyState, ErrorState, LoadingState } from "@/components/states/states";
import {
  createTicketShare,
  fetchMyTickets,
  fetchPublicEvent,
  type PublicEventApi,
  type TicketApi,
} from "@/lib/api";
import { formatDate, formatTime } from "@/lib/format";

export default function TicketDetailPage() {
  return (
    <AppShell backHref="/customer/tickets">
      <div className="container py-4" style={{ maxWidth: "34rem" }}>
        <RequireRole role="CUSTOMER">
          <TicketDetail />
        </RequireRole>
      </div>
    </AppShell>
  );
}

function TicketDetail() {
  const params = useParams<{ ticketId: string }>();
  const ticketId = params.ticketId;

  const [ticket, setTicket] = useState<TicketApi | null>(null);
  const [event, setEvent] = useState<PublicEventApi | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    setLoaded(false);

    fetchMyTickets()
      .then(async (tickets) => {
        const found = tickets.find((item) => item.id === ticketId) ?? null;
        setTicket(found);
        if (found) {
          setEvent(await fetchPublicEvent(found.event_id).catch(() => null));
        }
        setLoaded(true);
      })
      .catch(() => {
        setError("This ticket could not be loaded.");
        setLoaded(true);
      });
  }, [ticketId]);

  useEffect(load, [load]);

  async function handleShare() {
    setSharing(true);
    setShareError(null);
    try {
      const share = await createTicketShare(ticketId);
      setShareUrl(share.share_url);
    } catch {
      setShareError("The share link could not be created.");
    } finally {
      setSharing(false);
    }
  }

  if (error) {
    return <ErrorState description={error} onRetry={load} />;
  }

  if (!loaded) {
    return <LoadingState label="Loading ticket" />;
  }

  if (!ticket) {
    return (
      <EmptyState
        title="Ticket not found"
        description="This ticket does not belong to the signed-in account."
        action={
          <Link className="btn btn-primary" href="/customer/tickets">
            Back to my tickets
          </Link>
        }
      />
    );
  }

  const active = ticket.status === "ACTIVE";

  return (
    <div className="d-grid gap-3">
      <section className={`stub ${active ? "stub--valid" : "stub--muted"}`}>
        <div className="p-4 d-grid gap-2 text-center">
          <span className="badge text-cream mx-auto">Admit one</span>
          <h1 className="h2 text-cream mb-0">{event?.title ?? "Event"}</h1>
          <p className="font-mono small text-secondary mb-0">
            {event?.venue_name ?? "Venue to confirm"}
          </p>
        </div>

        <div className="perf d-flex align-items-center px-3">
          <span className="perf__line flex-grow-1" aria-hidden="true" />
        </div>

        <div className="p-4 d-grid gap-3 justify-content-center text-center">
          <dl className="row w-100 mb-0">
            <dt className="col-6 eyebrow">Date</dt>
            <dd className="col-6 eyebrow mb-0">Time</dd>
            <dd className="col-6 font-mono mb-0">{formatDate(event?.starts_at)}</dd>
            <dd className="col-6 font-mono mb-0">{formatTime(event?.starts_at)}</dd>
          </dl>

          <div className="d-flex justify-content-center">
            <QrCode value={ticket.qr_credential} />
          </div>

          <div>
            <p className="eyebrow mb-1">Holder</p>
            <p className="font-mono mb-0">{ticket.owner_name}</p>
          </div>

          <p
            className={`h4 mb-0 ${active ? "text-success" : "text-secondary"}`}
            role="status"
          >
            {active ? "VALID" : ticket.status}
          </p>
          {ticket.used_at ? (
            <p className="font-mono small text-secondary mb-0">
              Used at {formatDate(ticket.used_at)} {formatTime(ticket.used_at)}
            </p>
          ) : null}
        </div>
      </section>

      <p className="text-secondary small mb-0">
        The QR encodes a signed credential issued by the backend, not the ticket
        id. Gate staff scan or paste it to validate entry.
      </p>

      {shareUrl ? (
        <div className="alert alert-success" role="status">
          <p className="mb-2">Share link ready:</p>
          <a className="credential d-block text-break" href={shareUrl}>
            {shareUrl}
          </a>
        </div>
      ) : null}

      {shareError ? (
        <div className="alert alert-danger mb-0" role="alert">
          {shareError}
        </div>
      ) : null}

      <button
        className="btn btn-primary btn-lg"
        type="button"
        onClick={handleShare}
        disabled={sharing}
      >
        {sharing ? "Creating link…" : "Share this ticket"}
      </button>
    </div>
  );
}
