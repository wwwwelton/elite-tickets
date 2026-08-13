import Link from "next/link";
import { QrCode } from "@/components/tickets/qr-code";
import { EmptyState } from "@/components/states/states";
import { fetchSharedTicket } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type SharedTicketPageProps = {
  params: Promise<{ shareToken: string }>;
};

export default async function SharedTicketPage({ params }: SharedTicketPageProps) {
  const { shareToken } = await params;
  const ticket = await fetchSharedTicket(shareToken).catch(() => null);

  return (
    <main className="container py-5" style={{ maxWidth: "32rem" }}>
      {!ticket ? (
        <EmptyState
          title="Este link não está disponível"
          description="O link de compartilhamento é inválido ou não está mais ativo."
          action={
            <Link className="btn btn-primary" href="/">
              Navegar pelos eventos
            </Link>
          }
        />
      ) : (
        <div className="d-grid gap-3">
          <section className="stub" aria-label="Shared ticket">
            <div className="p-4 d-grid gap-2">
              <span className="badge text-cream">Ingresso compartilhado</span>
              <h1 className="h2 text-cream mb-0">{ticket.event_title}</h1>
            </div>

            <div className="perf d-flex align-items-center px-3">
              <span className="perf__line flex-grow-1" aria-hidden="true" />
            </div>

            <div className="p-4 d-grid gap-3 text-center">
              <div className="d-flex justify-content-center">
                <QrCode value={ticket.qr_credential} label="Credencial QR do ingresso compartilhado" />
              </div>
              <p className="font-mono small text-secondary mb-0">
                Emitido em {formatDate(ticket.issued_at)} {formatTime(ticket.issued_at)}
              </p>
              <p className="h5 mb-0">{ticket.status}</p>
            </div>
          </section>

          <p className="text-secondary small text-center mb-0">
            Visualização somente leitura. Nenhum detalhe da conta é exibido aqui.
          </p>

          <Link className="btn btn-primary btn-lg" href="/">
            Obter seu próprio ingresso
          </Link>
        </div>
      )}
    </main>
  );
}
