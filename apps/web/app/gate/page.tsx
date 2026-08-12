import { Scanner } from "@/components/tickets/scanner";
import { Ticket } from "@/components/ui";

export default function GatePage() {
  return (
    <main className="page-grid">
      <Ticket
        emphasized
        header={
          <>
            <p className="label-caps">Portaria</p>
            <h1 className="display-lg">Validar ingresso</h1>
          </>
        }
        details={<Scanner />}
      />
    </main>
  );
}
