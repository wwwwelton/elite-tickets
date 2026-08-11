import type { ReactNode } from "react";

export type LedgerRowProps = {
  label: ReactNode;
  value: ReactNode;
};

export function LedgerRow({ label, value }: LedgerRowProps) {
  return (
    <li className="ledger__row">
      <span>{label}</span>
      <span className="ledger__value">{value}</span>
    </li>
  );
}
