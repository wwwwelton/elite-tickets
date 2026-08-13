import { EventDetail } from "@/components/events/event-detail";
import { SiteShell } from "@/components/shell/site-shell";

export default function EventDetailPage() {
  return (
    <SiteShell
      title="Event detail"
      subtitle="Open an event to review the verified public information."
    >
      <EventDetail
        event={{
          id: "event-1",
          title: "Neon Horizon",
          startsAt: "2026-09-10T20:00:00Z",
          venueName: "Grand Cinema",
        }}
      />
    </SiteShell>
  );
}
