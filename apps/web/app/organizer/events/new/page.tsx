import { EventForm } from "@/components/events/event-form";

export default function NewOrganizerEventPage() {
  return (
    <main className="page-grid">
      <div style={{ gridColumn: "1 / -1" }}>
        <p className="label-caps">Organizador</p>
        <h1 className="display-lg">Criar evento</h1>
        <EventForm />
      </div>
    </main>
  );
}
