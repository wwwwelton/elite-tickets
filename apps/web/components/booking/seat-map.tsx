"use client";

import type { SeatLayout } from "@/lib/seating";
import { seatId } from "@/lib/seating";

export function SeatMap({
  layout,
  selected,
  max,
  onToggle,
}: {
  layout: SeatLayout;
  selected: string[];
  max: number;
  onToggle: (id: string) => void;
}) {
  const limitReached = selected.length >= max;

  return (
    <div className="d-grid gap-3">
      <div className="screen-bar text-center py-1">{layout.screenLabel}</div>

      <div className="d-grid gap-2 overflow-auto py-2">
        {layout.rows.map((row) => (
          <div
            className="d-flex align-items-center justify-content-center gap-1"
            key={row.label}
          >
            <span
              className="font-mono text-secondary small"
              style={{ width: "1rem" }}
              aria-hidden="true"
            >
              {row.label}
            </span>
            {row.seats.map((seat) => {
              const id = seatId(row.label, seat);
              const picked = selected.includes(id);
              return (
                <span className="d-flex" key={id}>
                  <button
                    className="seat"
                    type="button"
                    aria-pressed={picked}
                    aria-label={`Row ${row.label}, seat ${seat}`}
                    disabled={!picked && limitReached}
                    onClick={() => onToggle(id)}
                  >
                    {picked ? seat : ""}
                  </button>
                  {seat === row.aisleAfter ? (
                    <span className="seat-aisle" aria-hidden="true" />
                  ) : null}
                </span>
              );
            })}
          </div>
        ))}
      </div>

      <div className="d-flex flex-wrap gap-4 eyebrow mb-0">
        <span>
          <span
            className="legend-swatch me-2"
            style={{ backgroundColor: "#282a2b" }}
            aria-hidden="true"
          />
          Available
        </span>
        <span>
          <span
            className="legend-swatch me-2"
            style={{ backgroundColor: "var(--et-accent)", borderColor: "var(--et-accent)" }}
            aria-hidden="true"
          />
          Selected
        </span>
      </div>
    </div>
  );
}
