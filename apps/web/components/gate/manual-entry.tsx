type ManualEntryProps = {
  onSubmit?: () => void;
};

export function ManualEntry({ onSubmit }: ManualEntryProps) {
  return (
    <section
      aria-label="Manual ticket entry"
      style={{
        display: "grid",
        gap: "12px",
      }}
    >
      <div
        style={{
          color: "var(--muted)",
          fontSize: "12px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        Manual override
      </div>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <input
          aria-label="Ticket code"
          placeholder="Enter ticket code"
          style={{
            background: "transparent",
            border: "1px solid rgba(78, 70, 51, 0.8)",
            color: "var(--text)",
            flex: "1 1 220px",
            minHeight: "48px",
            padding: "0 14px",
          }}
        />
        <button
          type="button"
          onClick={onSubmit}
          style={{
            background: "var(--accent)",
            border: "none",
            color: "#121414",
            fontWeight: 700,
            minHeight: "48px",
            padding: "0 18px",
            textTransform: "uppercase",
          }}
        >
          Verify
        </button>
      </div>
    </section>
  );
}
