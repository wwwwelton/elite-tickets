import { EventForm } from "@/components/events/event-form";
import { Ticket } from "@/components/ui";

export default function NewOrganizerEventPage() {
  return (
    <main className="page-grid organizer-page create-event-page">
      <Ticket
        className="organizer-workspace"
        emphasized
        header={
          <>
            <p className="label-caps">Organizador</p>
            <h1 className="display-lg">Criar evento</h1>
          </>
        }
        details={<EventForm />}
      />
    </main>
  );
}
