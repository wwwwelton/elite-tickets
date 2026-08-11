import { MyTickets } from "@/components/tickets/my-tickets";

export default function TicketsPage() {
  return (
    <main className="page-grid">
      <div style={{ gridColumn: "1 / -1" }}>
        <p className="label-caps">Cliente</p>
        <h1 className="display-lg">Meus ingressos</h1>
        <MyTickets />
      </div>
    </main>
  );
}
