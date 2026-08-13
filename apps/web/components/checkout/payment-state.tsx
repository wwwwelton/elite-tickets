type PaymentStateProps = {
  status: "approved" | "declined" | "pending";
};

export function PaymentState({ status }: PaymentStateProps) {
  const label =
    status === "approved"
      ? "Payment approved"
      : status === "declined"
        ? "Payment declined"
        : "Payment pending";

  return (
    <p
      aria-live="polite"
      style={{
        border: "1px solid rgba(78, 70, 51, 0.8)",
        borderRadius: "var(--radius-md)",
        padding: "14px 16px",
      }}
    >
      {label}
    </p>
  );
}
