import type { PublicEventApi } from "./api";

export const MAX_TICKETS_PER_ORDER = 8;

export type SeatLayout = {
  mode: "seats";
  screenLabel: string;
  rows: Array<{ label: string; seats: number[]; aisleAfter: number }>;
};

export type SectorLayout = {
  mode: "sectors";
  sectors: Array<{ id: string; name: string; description: string }>;
};

export type VenueLayout = SeatLayout | SectorLayout;

const SEATED_VENUE_HINTS = ["cinema", "theat", "imax", "screen", "auditor"];

export function isSeatedVenue(event: Pick<PublicEventApi, "title" | "venue_name">) {
  const haystack = `${event.venue_name ?? ""} ${event.title}`.toLowerCase();
  return SEATED_VENUE_HINTS.some((hint) => haystack.includes(hint));
}

export function venueLayout(
  event: Pick<PublicEventApi, "title" | "venue_name">,
): VenueLayout {
  return isSeatedVenue(event) ? seatLayout() : sectorLayout();
}

function seatLayout(): SeatLayout {
  const rowLabels = ["A", "B", "C", "D", "E", "F", "G", "H"];
  return {
    mode: "seats",
    screenLabel: "Screen",
    rows: rowLabels.map((label) => ({
      label,
      seats: Array.from({ length: 12 }, (_, index) => index + 1),
      aisleAfter: 6,
    })),
  };
}

function sectorLayout(): SectorLayout {
  return {
    mode: "sectors",
    sectors: [
      {
        id: "floor",
        name: "Floor",
        description: "Área em pé em frente ao palco",
      },
      {
        id: "front-stage",
        name: "Front stage",
        description: "Área em pé mais próxima do palco",
      },
      {
        id: "grandstand-a",
        name: "Grandstand A",
        description: "Arquibancada com assentos, lado esquerdo do palco",
      },
      {
        id: "grandstand-b",
        name: "Grandstand B",
        description: "Arquibancada com assentos, lado direito do palco",
      },
    ],
  };
}

export function seatId(rowLabel: string, seat: number) {
  return `${rowLabel}${String(seat).padStart(2, "0")}`;
}
