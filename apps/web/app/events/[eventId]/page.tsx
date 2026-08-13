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
      <section
        style={{
          display: "grid",
          gap: "20px",
        }}
      >
        <EventDetail event={event} />
        <div
          style={{
            alignItems: "center",
            border: "1px solid rgba(78, 70, 51, 0.8)",
            borderRadius: "var(--radius-md)",
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            justifyContent: "space-between",
            padding: "18px",
          }}
        >
          <div>
            <div
              style={{
                color: "var(--muted)",
                fontSize: "12px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
            >
              Purchase entry
            </div>
            <p style={{ margin: "8px 0 0" }}>
              Sign in or create a customer account to continue.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <a
              href="/login"
              style={{
                background: "var(--accent)",
                borderRadius: "9999px",
                color: "#121414",
                fontWeight: 700,
                padding: "12px 18px",
              }}
            >
              Login
            </a>
            <a
              href="/register"
              style={{
                border: "1px solid rgba(78, 70, 51, 0.8)",
                borderRadius: "9999px",
                color: "var(--text)",
                padding: "12px 18px",
              }}
            >
              Create account
            </a>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
