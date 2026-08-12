"use client";

import QRCode from "qrcode";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { LedgerRow, Status, Ticket as TicketFrame } from "@/components/ui";
import { ShareAction } from "@/components/tickets/share-action";
import { ApiError, apiRequest } from "@/lib/api";

export type CustomerTicket = {
  id: string;
  event_id: string;
  owner_name: string;
  status: "ACTIVE" | "USED" | "CANCELLED";
  issued_at: string;
  used_at: string | null;
  qr_credential: string;
};

type EventSummary = { title: string; starts_at: string; venue_name: string };

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function CustomerTicketView({ allowShare = true, compact = false, ticket }: { allowShare?: boolean; compact?: boolean; ticket: CustomerTicket }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const headingId = useId();
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [eventUnavailable, setEventUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    apiRequest<EventSummary>(`/events/${encodeURIComponent(ticket.event_id)}`, { cache: "no-store" })
      .then((result) => {
        if (active) setEvent(result);
      })
      .catch(() => {
        if (active) setEventUnavailable(true);
      });
    return () => {
      active = false;
    };
  }, [ticket.event_id]);

  useEffect(() => {
    if (!canvas.current || compact) return;
    void QRCode.toCanvas(canvas.current, ticket.qr_credential, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 280,
      color: { dark: "#000000", light: "#ffffff" },
    });
  }, [compact, ticket.qr_credential]);

  const cancelled = ticket.status === "CANCELLED" || eventUnavailable;
  return (
    <TicketFrame
      aria-labelledby={headingId}
      aria-busy={!event && !eventUnavailable}
      className={compact ? "customer-ticket customer-ticket--compact" : "customer-ticket"}
      detailsLabel="Dados do ingresso"
      emphasized={!compact}
      header={
        <div className="ticket__header-copy">
          <p className="label-caps">Ingresso digital</p>
          <h2 className="headline-md" id={headingId}>
            {event?.title ?? (cancelled ? "Evento cancelado ou indisponível" : "Carregando evento…")}
          </h2>
        </div>
      }
      details={
        <ul className="ledger">
          <LedgerRow label="Titular" value={ticket.owner_name} />
          <LedgerRow label="Evento" value={ticket.event_id} />
          {event ? <LedgerRow label="Sessão" value={dateFormatter.format(new Date(event.starts_at))} /> : null}
          {event ? <LedgerRow label="Local" value={event.venue_name} /> : null}
          <LedgerRow label="Emissão" value={dateFormatter.format(new Date(ticket.issued_at))} />
        </ul>
      }
      footer={
        <div className="ticket__details-stack">
          <Status
            label={cancelled ? "Cancelado" : ticket.status === "ACTIVE" ? "Ativo" : "Utilizado"}
            status={cancelled ? "CANCELLED" : ticket.status}
          />
          {compact ? (
            <div className="ticket__actions">
              <Link className="button button--ghost" href={`/customer/tickets/${ticket.id}`}>Ver ingresso</Link>
            </div>
          ) : (
            <>
              <Credential credential={ticket.qr_credential} canvas={canvas} disabled={cancelled} />
              {allowShare && !cancelled && ticket.status === "ACTIVE" ? <ShareAction ticketId={ticket.id} /> : null}
            </>
          )}
        </div>
      }
    />
  );
}

function Credential({ credential, canvas, disabled }: { credential: string; canvas: React.RefObject<HTMLCanvasElement | null>; disabled: boolean }) {
  const labelId = useId();
  if (disabled) {
    return (
      <p role="status" aria-atomic="true">
        QR indisponível para entrada. Este ingresso não pode ser utilizado.
      </p>
    );
  }
  return (
    <section className="ticket__details-stack" aria-labelledby={labelId}>
      <canvas ref={canvas} role="img" aria-label="QR do ingresso para validação na portaria" />
      <div className="ticket__details-stack">
        <p className="label-caps" id={labelId}>
          Código para entrada manual
        </p>
        <code
          className="code-data"
          data-testid="ticket-credential"
          style={{ overflowWrap: "anywhere" }}
        >
          {credential}
        </code>
      </div>
    </section>
  );
}

export function ticketError(error: unknown): string {
  return error instanceof ApiError ? error.message : "Não foi possível carregar os ingressos.";
}
