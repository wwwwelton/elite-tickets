import { SiteShell } from "@/components/shell/site-shell";

export default function EventReservationPage() {
  return (
    <SiteShell
      title="Reserve tickets"
      subtitle="Choose a quantity and create a reservation within the supported limits."
    >
      <section
        style={{
          display: "grid",
          gap: "16px",
          maxWidth: "520px",
        }}
      >
        <label style={{ display: "grid", gap: "8px" }}>
          <span>Quantity</span>
          <input
            defaultValue={1}
            min={1}
            type="number"
            style={{
              background: "var(--surface)",
              border: "1px solid rgba(78, 70, 51, 0.8)",
              borderRadius: "var(--radius-md)",
              color: "var(--text)",
              padding: "14px 16px",
            }}
          />
        </label>
        <button
          type="button"
          style={{
            background: "var(--accent)",
            border: "none",
            borderRadius: "9999px",
            color: "#121414",
            fontWeight: 700,
            padding: "14px 18px",
          }}
        >
          Create reservation
        </button>
      </section>
    </SiteShell>
  );
}
