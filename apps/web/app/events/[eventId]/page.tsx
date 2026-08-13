import { EventDetail } from "@/components/events/event-detail";
import { SiteShell } from "@/components/shell/site-shell";
import { fetchPublicEvent } from "@/lib/api";
import { mapEventSummary } from "@/lib/mappers";

type EventDetailPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { eventId } = await params;
  const event = mapEventSummary(await fetchPublicEvent(eventId));

  return (
    <SiteShell
      title="Event detail"
      subtitle="Open an event to review the verified public information."
    >
      <EventDetail event={event} />
    </SiteShell>
  );
}
