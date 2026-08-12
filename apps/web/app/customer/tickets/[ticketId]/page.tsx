import { MyTickets } from "@/components/tickets/my-tickets";
import { Ticket } from "@/components/ui";

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
      />
    </main>
  );
}
