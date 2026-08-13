import type { GateValidationApi } from "@/lib/api";
import { formatTime } from "@/lib/format";

const CONTENT: Record<
  GateValidationApi["result"],
  { title: string; note: string; tone: string; symbol: string }
> = {
  VALID: {
    title: "Valid",
    note: "Entry approved",
    tone: "text-success border-success",
    symbol: "✓",
  },
  INVALID: {
    title: "Invalid",
    note: "Credential not recognized",
    tone: "text-danger border-danger",
    symbol: "!",
  },
  ALREADY_USED: {
    title: "Already used",
    note: "This ticket was already admitted",
    tone: "text-warning border-warning",
    symbol: "!",
  },
  WRONG_EVENT: {
    title: "Wrong event",
    note: "This ticket belongs to another event",
    tone: "text-danger border-danger",
    symbol: "×",
  },
};

export function GateStatus({
  validation,
  onDismiss,
}: {
  validation: GateValidationApi;
  onDismiss: () => void;
}) {
  const content = CONTENT[validation.result];

  return (
    <section
      className={`gate-result ${content.tone} p-4 text-center d-grid gap-3`}
      role="status"
      aria-live="assertive"
    >
      <span className="display-1 mb-0" aria-hidden="true">
        {content.symbol}
      </span>
      <h2 className="gate-result__title mb-0">{content.title}</h2>
      <p className="eyebrow text-body mb-0">{content.note}</p>
      <p className="font-mono small text-secondary mb-0">
        Checked at {formatTime(validation.attempted_at)}
      </p>
      <button className="btn btn-primary btn-lg" type="button" onClick={onDismiss}>
        Scan next ticket
      </button>
    </section>
  );
}
