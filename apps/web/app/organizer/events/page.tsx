import { OrganizerLedger } from "@/components/events/organizer-ledger";
import { Ticket } from "@/components/ui";
import Link from "next/link";

export default function OrganizerEventsPage() {
  return (
    <main className="page-grid organizer-page">
      <Ticket
        className="organizer-workspace"
        emphasized
        header={
          <>
            <p className="label-caps">Organizador</p>
            <h1 className="display-lg">Meus eventos</h1>
          </>
        }
        details={<OrganizerLedger />}
        footer={
          <div className="ticket__actions">
            <Link className="button button--ghost" href="/">
              Voltar aos eventos públicos
            </Link>
          </div>
        }
      />
    </main>
  );
}
