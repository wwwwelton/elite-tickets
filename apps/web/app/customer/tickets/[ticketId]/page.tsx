import { MyTickets } from "@/components/tickets/my-tickets";

export default async function TicketDetailPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  return (
    <main className="page-grid">
      <div style={{ gridColumn: "1 / -1" }}>
        <p className="label-caps">Ingresso</p>
        <h1 className="display-lg">Detalhes</h1>
        <MyTickets ticketId={ticketId} />
      </div>
    </main>
  );
}
