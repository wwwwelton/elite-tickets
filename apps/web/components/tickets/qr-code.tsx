type QrCodeProps = {
  credential: string;
  label?: string;
};

export function QrCode({ credential, label = "Secure QR credential" }: QrCodeProps) {
  return (
    <figure
      aria-label={label}
      style={{
        alignItems: "center",
        background: "var(--surface-container-lowest)",
        border: "1px solid rgba(78, 70, 51, 0.9)",
        borderRadius: "18px",
        display: "grid",
        gap: "14px",
        justifyItems: "center",
        margin: 0,
        padding: "22px",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(135deg, rgba(255, 235, 192, 0.92), rgba(243, 192, 25, 0.7))",
          borderRadius: "20px",
          boxShadow: "inset 0 0 0 12px rgba(18, 20, 20, 0.9)",
          height: "220px",
          width: "220px",
        }}
      />
      <figcaption style={{ display: "grid", gap: "4px", textAlign: "center" }}>
        <span
          style={{
            color: "var(--muted)",
            fontSize: "12px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          Secure credential
        </span>
        <strong style={{ letterSpacing: "0.12em" }}>{credential}</strong>
      </figcaption>
    </figure>
  );
}
