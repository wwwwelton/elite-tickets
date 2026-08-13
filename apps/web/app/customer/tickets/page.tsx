import Link from "next/link";
import { EmptyState } from "@/components/states/empty-state";
import { SiteShell } from "@/components/shell/site-shell";

export default function CustomerTicketsPage() {
  return (
    <SiteShell
      title="My Tickets"
      subtitle="Review active tickets, open a ticket detail, and share the pass with another device."
    >
      <div style={{ display: "grid", gap: "20px" }}>
        <EmptyState
          title="No tickets loaded yet"
          description="The My Tickets experience is wired to the verified backend contract in the next task."
        />
        <div
          aria-label="Customer ticket shortcuts"
          style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}
        >
          <Link href="/customer">Back to customer home</Link>
          <Link href="/events/event-1">Browse events</Link>
        </div>
      </div>
    </SiteShell>
  );
}
