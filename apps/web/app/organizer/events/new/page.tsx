import { EventForm } from "@/components/events/event-form";
import { Ticket } from "@/components/ui";
import Link from "next/link";

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
        footer={
          <div className="ticket__actions">
            <Link className="button button--ghost" href="/organizer/events">
              Voltar aos meus eventos
            </Link>
          </div>
        }
      />
    </main>
  );
}
