import type { PublicEventApi } from "./api";
import { MAX_TICKETS_PER_ORDER } from "./seating";

export type Availability = {
  remaining: number | null;
  soldOut: boolean;
  lowStock: boolean;
  maxSelectable: number;
  label: string;
};

export function availabilityOf(event: PublicEventApi): Availability {
  const remaining = event.available_quantity ?? null;

  if (remaining === null) {
    return {
      remaining: null,
      soldOut: false,
      lowStock: false,
      maxSelectable: MAX_TICKETS_PER_ORDER,
      label: "À venda",
    };
  }

  const capacity = event.capacity ?? 0;

  return {
    remaining,
    soldOut: remaining === 0,
    lowStock: remaining > 0 && capacity > 0 && remaining / capacity <= 0.15,
    maxSelectable: Math.min(MAX_TICKETS_PER_ORDER, remaining),
    label:
      remaining === 0
        ? "Esgotado"
        : capacity > 0
          ? `${remaining} de ${capacity} disponíveis`
          : `${remaining} disponíveis`,
  };
}
