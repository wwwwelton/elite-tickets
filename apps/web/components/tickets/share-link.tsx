type ShareLinkProps = {
  shareUrl: string;
};

export function ShareLink({ shareUrl }: ShareLinkProps) {
  return (
    <a
      href={shareUrl}
      style={{
        alignItems: "center",
        border: "1px solid rgba(78, 70, 51, 0.8)",
        borderRadius: "9999px",
        display: "inline-flex",
        fontWeight: 700,
        gap: "10px",
        minHeight: "48px",
        padding: "12px 18px",
      }}
    >
      Share ticket
    </a>
  );
}
