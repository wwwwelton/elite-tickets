import type { EventSummary } from "@/lib/mappers";

type EventDetailProps = {
  event: EventSummary;
};

export function EventDetail({ event }: EventDetailProps) {
  return (
    <section
      style={{
        display: "grid",
        gap: "20px",
      }}
    >
      <div
        style={{
          aspectRatio: "16 / 9",
          background:
            "linear-gradient(135deg, rgba(243,192,25,0.42), rgba(18,20,20,0.96))",
          border: "1px solid rgba(78, 70, 51, 0.8)",
          borderRadius: "var(--radius-lg)",
        }}
      />
      <div>
        <div
          style={{
            color: "var(--muted)",
            fontSize: "13px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          Event detail
        </div>
        <h2 style={{ margin: "10px 0 0", fontSize: "clamp(30px, 5vw, 56px)" }}>
          {event.title}
        </h2>
        <p style={{ color: "var(--muted)", margin: "12px 0 0" }}>
          {event.venueName ?? "Venue pending"} · {event.startsAt ?? "Date pending"}
        </p>
      </div>
    </section>
  );
}
