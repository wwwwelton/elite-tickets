import { MyTickets } from "@/components/tickets/my-tickets";
import { Ticket } from "@/components/ui";
import Link from "next/link";

export default function TicketsPage() {
  return (
    <main className="page-grid tickets-page">
      <Ticket
        emphasized
        header={
          <>
            <p className="label-caps">Cliente</p>
            <h1 className="display-lg">Meus ingressos</h1>
          </>
        }
        details={<MyTickets />}
        footer={
          <div className="ticket__actions">
            <Link className="button button--ghost" href="/">
              Voltar aos eventos
            </Link>
          </div>
        }
      />
    </main>
  );
}
