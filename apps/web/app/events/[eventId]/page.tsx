import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { EventDetail } from "@/components/events/event-detail";
import { EventHero } from "@/components/events/event-hero";
import { PurchaseCta } from "@/components/events/purchase-cta";
import { fetchPublicEvent } from "@/lib/api";
import { availabilityOf } from "@/lib/availability";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

type EventDetailPageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { eventId } = await params;

  const event = await fetchPublicEvent(eventId).catch(() => null);
  if (!event) {
    notFound();
  }

  return (
    <AppShell backHref="/" bare>
      <EventHero event={event} />
      <div className="container py-4">
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            <EventDetail event={event} />
          </div>
          <div className="col-12 col-lg-4">
            <div className="card p-3 sticky-lg-top" style={{ top: "6rem" }}>
              <p className="eyebrow mb-1">Admission</p>
              <p className="display-6 text-cream mb-1">
                {formatMoney(event.price)}
              </p>
              <p className="text-secondary small">
                Price per ticket, defined by the organizer.
              </p>
              <PurchaseCta
                eventId={event.id}
                soldOut={availabilityOf(event).soldOut}
              />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
