import type { PublicEventApi, ReservationApi } from "./api";

export type ReservationSnapshot = {
  reservation: ReservationApi;
  event: PublicEventApi;
  selection: string[];
};

const KEY_PREFIX = "elite-tickets.reservation.";

export function saveReservationSnapshot(snapshot: ReservationSnapshot) {
  window.sessionStorage.setItem(
    `${KEY_PREFIX}${snapshot.reservation.id}`,
    JSON.stringify(snapshot),
  );
}

export function readReservationSnapshot(
  reservationId: string,
): ReservationSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(`${KEY_PREFIX}${reservationId}`);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ReservationSnapshot;
  } catch {
    return null;
  }
}

export function clearReservationSnapshot(reservationId: string) {
  window.sessionStorage.removeItem(`${KEY_PREFIX}${reservationId}`);
}
