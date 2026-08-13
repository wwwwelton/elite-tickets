type EventSearchProps = {
  value?: string;
};

export function EventSearch({ value = "" }: EventSearchProps) {
  return (
    <label
      aria-label="Search public events"
      style={{
        alignItems: "center",
        background: "var(--surface)",
        border: "1px solid rgba(78, 70, 51, 0.8)",
        borderRadius: "9999px",
        display: "flex",
        gap: "12px",
        padding: "14px 18px",
      }}
    >
      <span
        style={{
          color: "var(--muted)",
          fontSize: "13px",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}
      >
        Search
      </span>
      <input
        aria-label="Search events"
        defaultValue={value}
        placeholder="Search events, movies, or venues"
        style={{
          background: "transparent",
          border: "none",
          color: "var(--text)",
          flex: 1,
          minWidth: 0,
        }}
      />
    </label>
  );
}
