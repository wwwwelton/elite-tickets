import { MyTickets } from "@/components/tickets/my-tickets";
import { Ticket } from "@/components/ui";
import Link from "next/link";

export default async function TicketDetailPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  return (
    <main className="page-grid ticket-detail-page">
      <Ticket
        emphasized
        header={
          <>
            <p className="label-caps">Ingresso</p>
            <h1 className="display-lg">Detalhes</h1>
          </>
        }
        details={<MyTickets ticketId={ticketId} />}
        footer={
          <div className="ticket__actions">
            <Link className="button button--ghost" href="/customer/tickets">
              Voltar aos meus ingressos
            </Link>
          </div>
        }
      />
    </main>
  );
}
