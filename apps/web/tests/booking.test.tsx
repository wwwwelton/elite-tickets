import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { useState } from "react";
import { describe, expect, it } from "vitest";
import { SeatMap } from "@/components/booking/seat-map";
import { SectorPicker } from "@/components/booking/sector-picker";
import { MAX_TICKETS_PER_ORDER, isSeatedVenue, venueLayout } from "@/lib/seating";
import { arenaEvent, cinemaEvent } from "./fixtures/events";

function SeatHarness({ max = MAX_TICKETS_PER_ORDER }: { max?: number }) {
  const layout = venueLayout(cinemaEvent);
  const [selected, setSelected] = useState<string[]>([]);

  if (layout.mode !== "seats") {
    throw new Error("expected a seated layout");
  }

  return (
    <>
      <SeatMap
        layout={layout}
        selected={selected}
        max={max}
        onToggle={(id) =>
          setSelected((current) =>
            current.includes(id)
              ? current.filter((seat) => seat !== id)
              : current.length < max
                ? [...current, id]
                : current,
          )
        }
      />
      <output>{selected.length}</output>
    </>
  );
}

function SectorHarness() {
  const layout = venueLayout(arenaEvent);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  if (layout.mode !== "sectors") {
    throw new Error("expected a sector layout");
  }

  const total = Object.values(quantities).reduce((sum, value) => sum + value, 0);

  return (
    <>
      <SectorPicker
        layout={layout}
        quantities={quantities}
        unitPrice={arenaEvent.price}
        remaining={MAX_TICKETS_PER_ORDER - total}
        onChange={(sectorId, quantity) =>
          setQuantities((current) => ({ ...current, [sectorId]: Math.max(0, quantity) }))
        }
      />
      <output data-testid="total">{total}</output>
    </>
  );
}

describe("venue layout", () => {
  it("uses assigned seating for cinema-style venues", () => {
    expect(isSeatedVenue(cinemaEvent)).toBe(true);
    expect(venueLayout(cinemaEvent).mode).toBe("seats");
  });

  it("uses sectors for standing venues", () => {
    expect(isSeatedVenue(arenaEvent)).toBe(false);
    expect(venueLayout(arenaEvent).mode).toBe("sectors");
  });
});

describe("seat map", () => {
  it("toggles a seat on and off", async () => {
    const user = userEvent.setup();
    render(<SeatHarness />);

    const seat = screen.getByRole("button", { name: "Row A, seat 1" });
    await user.click(seat);
    expect(seat).toHaveAttribute("aria-pressed", "true");

    await user.click(seat);
    expect(seat).toHaveAttribute("aria-pressed", "false");
  });

  it("stops accepting new seats once the order limit is reached", async () => {
    const user = userEvent.setup();
    render(<SeatHarness max={1} />);

    await user.click(screen.getByRole("button", { name: "Row A, seat 1" }));

    expect(screen.getByRole("button", { name: "Row A, seat 2" })).toBeDisabled();
  });
});

describe("sector picker", () => {
  it("adds tickets to a sector", async () => {
    const user = userEvent.setup();
    render(<SectorHarness />);

    await user.click(screen.getByRole("button", { name: "Add one ticket to Floor" }));
    await user.click(screen.getByRole("button", { name: "Add one ticket to Floor" }));

    expect(screen.getByTestId("total")).toHaveTextContent("2");
  });

  it("cannot go below zero in a sector", () => {
    render(<SectorHarness />);

    expect(
      screen.getByRole("button", { name: "Remove one ticket from Floor" }),
    ).toBeDisabled();
  });
});
