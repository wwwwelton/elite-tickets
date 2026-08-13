import type { ValidationSummary } from "@/lib/mappers";

type GateStatusProps = {
  result: ValidationSummary["result"] | "VALID" | "INVALID" | "ALREADY_USED" | "WRONG_EVENT";
};

const statusContent = {
  VALID: {
    title: "VALID",
    description: "Entry approved.",
    tone: "var(--ticket-valid)",
  },
  INVALID: {
    title: "INVALID",
    description: "Ticket not recognized.",
    tone: "var(--ticket-void)",
  },
  ALREADY_USED: {
    title: "ALREADY USED",
    description: "This ticket has already been consumed.",
    tone: "var(--ticket-void)",
  },
  WRONG_EVENT: {
    title: "WRONG EVENT",
    description: "This ticket belongs to another event.",
    tone: "var(--ticket-void)",
  },
} as const;

export function GateStatus({ result }: GateStatusProps) {
  const content = statusContent[result];

  return (
    <section
      aria-label="Gate validation result"
      style={{
        border: `3px solid ${content.tone}`,
        display: "grid",
        gap: "18px",
        padding: "22px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          color: content.tone,
          fontSize: "clamp(44px, 9vw, 80px)",
          fontWeight: 700,
          letterSpacing: "0.08em",
        }}
      >
        {content.title}
      </div>
      <p style={{ margin: 0 }}>{content.description}</p>
    </section>
  );
}
