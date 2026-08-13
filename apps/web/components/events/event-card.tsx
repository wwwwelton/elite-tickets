import type { EventSummary } from "@/lib/mappers";

type EventCardProps = {
  event: EventSummary;
};

export function EventCard({ event }: EventCardProps) {
  return (
    <article
      style={{
        background: "var(--surface)",
        border: "1px solid rgba(78, 70, 51, 0.8)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        minHeight: "260px",
      }}
    >
      <div
        style={{
          aspectRatio: "4 / 5",
          background:
            "linear-gradient(135deg, rgba(243,192,25,0.35), rgba(35,38,38,0.95))",
          borderBottom: "1px solid rgba(78, 70, 51, 0.8)",
        }}
      />
      <div style={{ padding: "18px" }}>
        <div
          style={{
            color: "var(--muted)",
            fontSize: "12px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          {event.venueName ?? "Venue pending"}
        </div>
        <h3 style={{ margin: "8px 0 0", fontSize: "24px" }}>{event.title}</h3>
        <p style={{ color: "var(--muted)", margin: "10px 0 0" }}>
          {event.startsAt ?? "Date pending"}
        </p>
      </div>
    </article>
  );
}
