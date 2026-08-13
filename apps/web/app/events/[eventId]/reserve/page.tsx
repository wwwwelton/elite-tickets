"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { RequireRole } from "@/components/shell/require-role";
import { SeatMap } from "@/components/booking/seat-map";
import { SectorPicker } from "@/components/booking/sector-picker";
import { ErrorState, LoadingState } from "@/components/states/states";
import {
  ApiError,
  createReservation,
  fetchPublicEvent,
  type PublicEventApi,
} from "@/lib/api";
import { availabilityOf } from "@/lib/availability";
import { formatDate, formatMoney, formatTime, multiplyPrice } from "@/lib/format";
import { saveReservationSnapshot } from "@/lib/reservation-store";
import { venueLayout } from "@/lib/seating";

export default function ReservePage() {
  return (
    <AppShell bare>
      <RequireRoleWrapper />
    </AppShell>
  );
}

function RequireRoleWrapper() {
  return (
    <div className="container py-4">
      <RequireRole role="CUSTOMER">
        <ReserveFlow />
      </RequireRole>
    </div>
  );
}

function ReserveFlow() {
  const params = useParams<{ eventId: string }>();
  const router = useRouter();
  const eventId = params.eventId;

  const [event, setEvent] = useState<PublicEventApi | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [seats, setSeats] = useState<string[]>([]);
  const [sectorQuantities, setSectorQuantities] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoadError(null);
    fetchPublicEvent(eventId)
      .then(setEvent)
      .catch(() =>
        setLoadError("This event could not be loaded. It may no longer be on sale."),
      );
  }, [eventId]);

  useEffect(load, [load]);

  const layout = useMemo(() => (event ? venueLayout(event) : null), [event]);

  const selection = useMemo(() => {
    if (!layout) {
      return [] as string[];
    }
    if (layout.mode === "seats") {
      return [...seats].sort();
    }
    return layout.sectors.flatMap((sector) =>
      Array.from(
        { length: sectorQuantities[sector.id] ?? 0 },
        (_, index) => `${sector.name} #${index + 1}`,
      ),
    );
  }, [layout, seats, sectorQuantities]);

  const availability = event
    ? availabilityOf(event)
    : { maxSelectable: 0, label: "", soldOut: false, lowStock: false, remaining: null };
  const maxTickets = availability.maxSelectable;
  const quantity = selection.length;
  const remaining = maxTickets - quantity;
  const total = multiplyPrice(event?.price, quantity);

  function toggleSeat(id: string) {
    setSeats((current) =>
      current.includes(id)
        ? current.filter((seat) => seat !== id)
        : current.length < maxTickets
          ? [...current, id]
          : current,
    );
  }

  function changeSector(sectorId: string, next: number) {
    setSectorQuantities((current) => {
      const clamped = Math.max(0, next);
      const others = Object.entries(current)
        .filter(([key]) => key !== sectorId)
        .reduce((sum, [, value]) => sum + value, 0);
      if (others + clamped > maxTickets) {
        return current;
      }
      return { ...current, [sectorId]: clamped };
    });
  }

  async function handleReserve() {
    if (!event || quantity === 0) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const reservation = await createReservation(event.id, quantity);
      saveReservationSnapshot({ reservation, event, selection });
      router.push(`/customer/checkout/${reservation.id}`);
    } catch (caught) {
      setSubmitError(
        caught instanceof ApiError && caught.status === 409
          ? "There are not enough tickets left for this quantity. Adjust your selection and try again."
          : caught instanceof ApiError
            ? caught.message
            : "The reservation could not be created. Try again.",
      );
      setSubmitting(false);
    }
  }

  if (loadError) {
    return <ErrorState description={loadError} onRetry={load} />;
  }

  if (!event || !layout) {
    return <LoadingState label="Loading the venue" />;
  }

  return (
    <div className="d-grid gap-4">
      <header className="d-grid gap-1">
        <p className="eyebrow mb-0">
          {formatDate(event.starts_at)} · {formatTime(event.starts_at)} ·{" "}
          {event.venue_name ?? "Venue to confirm"}
        </p>
        <h1 className="display-5 text-cream mb-0">{event.title}</h1>
      </header>

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="card p-3 p-lg-4">
            <h2 className="h5 text-cream mb-1">
              {layout.mode === "seats" ? "Pick your seats" : "Pick your sectors"}
            </h2>
            <p className="text-secondary small">
              {layout.mode === "seats"
                ? "Choose where you want to sit. The seat map is a selection aid — the backend confirms the ticket quantity, and staff assign the final seats at the venue."
                : "Choose how many tickets you want in each sector. Every sector uses the single price published by the organizer."}
            </p>

            {layout.mode === "seats" ? (
              <SeatMap
                layout={layout}
                selected={seats}
                max={maxTickets}
                onToggle={toggleSeat}
              />
            ) : (
              <SectorPicker
                layout={layout}
                quantities={sectorQuantities}
                unitPrice={event.price}
                remaining={remaining}
                onChange={changeSector}
              />
            )}
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card p-3 d-grid gap-2">
            <p className="eyebrow mb-0">Your order</p>
            <dl className="row mb-0">
              <dt className="col-7 fw-normal text-secondary">Unit price</dt>
              <dd className="col-5 text-end font-mono">{formatMoney(event.price)}</dd>
              <dt className="col-7 fw-normal text-secondary">Tickets</dt>
              <dd className="col-5 text-end font-mono">{quantity}</dd>
            </dl>

            {selection.length > 0 ? (
              <p className="font-mono small text-secondary mb-0">
                {selection.join(" · ")}
              </p>
            ) : null}

            <hr className="my-1" />
            <div className="d-flex justify-content-between align-items-baseline">
              <span className="eyebrow mb-0">Total</span>
              <span className="h3 text-cream mb-0">{formatMoney(total)}</span>
            </div>

            <p className="text-secondary small mb-0">
              {availability.label} · up to {maxTickets} per order.
            </p>

            {submitError ? (
              <div className="alert alert-danger mb-0" role="alert">
                {submitError}
              </div>
            ) : null}

            <button
              className="btn btn-primary btn-lg"
              type="button"
              disabled={quantity === 0 || submitting}
              onClick={handleReserve}
            >
              {submitting ? "Holding your tickets…" : "Continue to checkout"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
