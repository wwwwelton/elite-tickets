import { OrganizerLedger } from "@/components/events/organizer-ledger";
import { Ticket } from "@/components/ui";

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
      />
    </main>
  );
}
