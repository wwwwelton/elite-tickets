"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { RequireRole } from "@/components/shell/require-role";
import { HoldCountdown } from "@/components/checkout/hold-countdown";
import { OrderStub } from "@/components/checkout/order-stub";
import { EmptyState } from "@/components/states/states";
import { ApiError, submitPayment, type PaymentApi } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import {
  readReservationSnapshot,
  type ReservationSnapshot,
} from "@/lib/reservation-store";
import { useSession } from "@/lib/session";

type PaymentToken = "tok_approved" | "tok_declined";

export default function CheckoutPage() {
  return (
    <AppShell bare>
      <div className="container py-4" style={{ maxWidth: "44rem" }}>
        <RequireRole role="CUSTOMER">
          <CheckoutFlow />
        </RequireRole>
      </div>
    </AppShell>
  );
}

function CheckoutFlow() {
  const params = useParams<{ reservationId: string }>();
  const reservationId = params.reservationId;
  const { session } = useSession();

  const [snapshot, setSnapshot] = useState<ReservationSnapshot | null>(null);
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<PaymentToken>("tok_approved");
  const [pending, setPending] = useState(false);
  const [expired, setExpired] = useState(false);
  const [result, setResult] = useState<PaymentApi | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSnapshot(readReservationSnapshot(reservationId));
    setReady(true);
  }, [reservationId]);

  const handleExpire = useCallback(() => setExpired(true), []);

  async function handlePayment() {
    setPending(true);
    setError(null);

    try {
      const payment = await submitPayment(reservationId, token);
      setResult(payment);
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.status === 409
          ? "This reservation is no longer payable — it expired or was already processed. Start a new order to continue."
          : caught instanceof ApiError
            ? caught.message
            : "The payment could not be submitted. Try again.",
      );
    } finally {
      setPending(false);
    }
  }

  if (!ready) {
    return null;
  }

  if (!snapshot) {
    return (
      <EmptyState
        title="Order details are no longer in this browser"
        description="Reservation summaries are kept for the current tab only. Pick your tickets again to restart the checkout."
        action={
          <Link className="btn btn-primary" href="/">
            Back to discovery
          </Link>
        }
      />
    );
  }

  if (result?.decision === "APPROVED") {
    return <ApprovedPanel payment={result} />;
  }

  if (result?.decision === "DECLINED") {
    return <DeclinedPanel eventId={snapshot.event.id} reservationId={reservationId} />;
  }

  return (
    <div className="d-grid gap-4">
      <header className="d-grid gap-1">
        <p className="eyebrow mb-0">Checkout</p>
        <h1 className="display-5 text-cream mb-0">Review and pay</h1>
        <HoldCountdown
          expiresAt={snapshot.reservation.expires_at}
          onExpire={handleExpire}
        />
      </header>

      <section className="card p-3 d-grid gap-2" aria-label="Customer information">
        <h2 className="h5 text-cream mb-0">Customer</h2>
        <dl className="row mb-0">
          <dt className="col-5 fw-normal text-secondary">Name</dt>
          <dd className="col-7 font-mono mb-0">{session?.displayName}</dd>
          <dt className="col-5 fw-normal text-secondary">Email</dt>
          <dd className="col-7 font-mono mb-0">{session?.email}</dd>
        </dl>
        <p className="text-secondary small mb-0">
          Tickets are issued to the signed-in account.
        </p>
      </section>

      <OrderStub
        event={snapshot.event}
        reservation={snapshot.reservation}
        selection={snapshot.selection}
      />

      <section className="card p-3 d-grid gap-3" aria-label="Payment method">
        <div>
          <h2 className="h5 text-cream mb-1">Payment</h2>
          <p className="text-secondary small mb-0">
            Payment is simulated by the backend. Pick the outcome you want to
            exercise.
          </p>
        </div>

        <div className="d-grid gap-2">
          <label className={`card p-3 flex-row gap-3 align-items-center ${token === "tok_approved" ? "border-warning" : ""}`}>
            <input
              className="form-check-input mt-0"
              type="radio"
              name="payment-token"
              checked={token === "tok_approved"}
              onChange={() => setToken("tok_approved")}
            />
            <span>
              <span className="d-block text-cream">Card ending 4242</span>
              <span className="d-block text-secondary small">
                Simulated approval
              </span>
            </span>
          </label>

          <label className={`card p-3 flex-row gap-3 align-items-center ${token === "tok_declined" ? "border-warning" : ""}`}>
            <input
              className="form-check-input mt-0"
              type="radio"
              name="payment-token"
              checked={token === "tok_declined"}
              onChange={() => setToken("tok_declined")}
            />
            <span>
              <span className="d-block text-cream">Card ending 0002</span>
              <span className="d-block text-secondary small">
                Simulated decline
              </span>
            </span>
          </label>
        </div>

        {error ? (
          <div className="alert alert-danger mb-0" role="alert">
            {error}
          </div>
        ) : null}

        {expired ? (
          <div className="alert alert-warning mb-0" role="alert">
            The reservation hold expired. Start a new order to buy these tickets.
          </div>
        ) : null}

        <button
          className="btn btn-primary btn-lg"
          type="button"
          disabled={pending || expired}
          onClick={handlePayment}
        >
          {pending
            ? "Submitting payment…"
            : `Pay ${formatMoney(snapshot.reservation.total_amount)}`}
        </button>

        <Link className="btn btn-outline-light" href={`/events/${snapshot.event.id}`}>
          Back to event
        </Link>
      </section>
    </div>
  );
}

function DeclinedPanel({
  eventId,
  reservationId,
}: {
  eventId: string;
  reservationId: string;
}) {
  return (
    <div className="d-grid gap-4 text-center">
      <div>
        <p className="eyebrow mb-1">Order {reservationId.slice(0, 8)}</p>
        <h1 className="display-4 text-danger mb-1">Payment declined</h1>
        <p className="text-secondary mb-0">
          The backend closed this reservation, so it can no longer be paid. Your
          seats were released — pick them again to retry with another method.
        </p>
      </div>

      <div className="d-grid gap-2">
        <Link className="btn btn-primary btn-lg" href={`/events/${eventId}/reserve`}>
          Start a new order
        </Link>
        <Link className="btn btn-outline-light" href={`/events/${eventId}`}>
          Back to event
        </Link>
      </div>
    </div>
  );
}

function ApprovedPanel({ payment }: { payment: PaymentApi }) {
  return (
    <div className="d-grid gap-4 text-center">
      <div>
        <p className="eyebrow mb-1">Order {payment.reservation.id.slice(0, 8)}</p>
        <h1 className="display-4 text-cream mb-1">Payment approved</h1>
        <p className="text-secondary mb-0">
          {payment.tickets.length} ticket(s) issued for{" "}
          {formatMoney(payment.reservation.total_amount)}.
        </p>
      </div>

      <ul className="list-unstyled d-grid gap-2 mb-0 text-start">
        {payment.tickets.map((ticket) => (
          <li className="card p-3 d-flex flex-row justify-content-between gap-3" key={ticket.id}>
            <span className="font-mono small">{ticket.id}</span>
            <span className="badge text-success">{ticket.status}</span>
          </li>
        ))}
      </ul>

      <div className="d-grid gap-2">
        <Link className="btn btn-primary btn-lg" href="/customer/tickets">
          View my tickets
        </Link>
        <Link className="btn btn-outline-light" href="/">
          Keep exploring
        </Link>
      </div>
    </div>
  );
}
