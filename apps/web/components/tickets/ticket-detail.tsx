import type { TicketSummary } from "@/lib/mappers";
import { QrCode } from "./qr-code";
import { ShareLink } from "./share-link";
import { TicketCard } from "./ticket-card";

type TicketDetailProps = {
  ticket: TicketSummary;
  title: string;
  venue: string;
  startsAt: string;
  shareUrl?: string;
};

export function TicketDetail({
  ticket,
  title,
  venue,
  startsAt,
  shareUrl,
}: TicketDetailProps) {
  return (
    <section
      aria-label="Ticket detail"
      style={{ display: "grid", gap: "20px", maxWidth: "640px" }}
    >
      <TicketCard ticket={ticket} title={title} venue={venue} startsAt={startsAt} />
      <QrCode credential={ticket.qrCredential ?? "QR credential unavailable"} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
        {shareUrl ? <ShareLink shareUrl={shareUrl} /> : null}
      </div>
    </section>
  );
}
