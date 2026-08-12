const AFFIRMATIVE = ["PUBLISHED", "AVAILABLE", "ACTIVE", "APPROVED", "VALID"] as const;
const PENDING = ["DRAFT", "PENDING"] as const;
const INACTIVE = ["FINISHED", "EXPIRED", "USED", "ALREADY_USED"] as const;
const CRITICAL = ["CANCELLED", "DECLINED", "INVALID", "WRONG_EVENT", "SOLD_OUT"] as const;

export type ProductStatus =
  | (typeof AFFIRMATIVE)[number]
  | (typeof PENDING)[number]
  | (typeof INACTIVE)[number]
  | (typeof CRITICAL)[number];

const STATUS_SYMBOL: Record<ProductStatus, string> = {
  PUBLISHED: "✓",
  AVAILABLE: "✓",
  ACTIVE: "✓",
  APPROVED: "✓",
  VALID: "✓",
  DRAFT: "•",
  PENDING: "⌛",
  FINISHED: "—",
  EXPIRED: "—",
  USED: "—",
  ALREADY_USED: "—",
  CANCELLED: "×",
  DECLINED: "×",
  INVALID: "×",
  WRONG_EVENT: "×",
  SOLD_OUT: "×",
};

function statusTone(status: ProductStatus) {
  if ((AFFIRMATIVE as readonly string[]).includes(status)) return "affirmative";
  if ((PENDING as readonly string[]).includes(status)) return "pending";
  if ((INACTIVE as readonly string[]).includes(status)) return "inactive";
  if ((CRITICAL as readonly string[]).includes(status)) return "critical";
  throw new Error(`Unsupported product status: ${status}`);
}

export type StatusProps = {
  label?: string;
  status: ProductStatus;
};

export function Status({ label, status }: StatusProps) {
  const modifiers = [
    "status",
    `status--${statusTone(status)}`,
    status === "VALID" ? "status--valid" : "",
    status === "ALREADY_USED" ? "status--already-used" : "",
    status === "SOLD_OUT" ? "status--sold-out" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={modifiers} data-status={status} aria-label={label ?? status}>
      <span aria-hidden="true">{STATUS_SYMBOL[status]}</span>
      {label ?? status}
    </span>
  );
}
