"use client";

import { formatMoney } from "@/lib/format";
import type { SectorLayout } from "@/lib/seating";

export function SectorPicker({
  layout,
  quantities,
  unitPrice,
  remaining,
  onChange,
}: {
  layout: SectorLayout;
  quantities: Record<string, number>;
  unitPrice?: string;
  remaining: number;
  onChange: (sectorId: string, quantity: number) => void;
}) {
  return (
    <ul className="list-unstyled d-grid gap-2 mb-0">
      {layout.sectors.map((sector) => {
        const quantity = quantities[sector.id] ?? 0;
        return (
          <li
            className={`card p-3 flex-row flex-wrap align-items-center justify-content-between gap-3 ${
              quantity > 0 ? "border-warning" : ""
            }`}
            key={sector.id}
          >
            <div>
              <h3 className="h5 text-cream mb-1">{sector.name}</h3>
              <p className="text-secondary small mb-1">{sector.description}</p>
              <span className="font-mono">{formatMoney(unitPrice)}</span>
            </div>

            <div className="btn-group" role="group" aria-label={`${sector.name} quantity`}>
              <button
                className="btn btn-outline-light"
                type="button"
                aria-label={`Remove one ticket from ${sector.name}`}
                disabled={quantity === 0}
                onClick={() => onChange(sector.id, quantity - 1)}
              >
                −
              </button>
              <span className="btn btn-outline-light disabled font-mono" aria-live="polite">
                {quantity}
              </span>
              <button
                className="btn btn-outline-light"
                type="button"
                aria-label={`Add one ticket to ${sector.name}`}
                disabled={remaining === 0}
                onClick={() => onChange(sector.id, quantity + 1)}
              >
                +
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
