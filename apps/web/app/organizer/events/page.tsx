import { OrganizerLedger } from "@/components/events/organizer-ledger";
import { Ticket } from "@/components/ui";

export default function OrganizerEventsPage() {
  return (
    <main className="page-grid">
      <Ticket
        emphasized
        header={
          <>
            <p className="label-caps">Organizador</p>
            <h1 className="display-lg">Meus eventos</h1>
          </>
        }
        details={<OrganizerLedger />}
      />
    </main>
  );
}
