import { OrganizerLedger } from "@/components/events/organizer-ledger";

export default function OrganizerEventsPage() {
  return (
    <main className="page-grid">
      <div style={{ gridColumn: "1 / -1" }}>
        <p className="label-caps">Organizador</p>
        <h1 className="display-lg">Meus eventos</h1>
        <OrganizerLedger />
      </div>
    </main>
  );
}
