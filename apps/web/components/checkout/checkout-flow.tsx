"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Countdown } from "@/components/checkout/countdown";
import { LedgerRow, Status } from "@/components/ui";
import { ApiError, apiMutation } from "@/lib/api";
import { guardRoute } from "@/lib/auth";

type Reservation = {
  id: string;
  event_id: string;
  status: "PENDING" | "APPROVED" | "DECLINED" | "EXPIRED" | "CANCELLED";
  quantity: number;
  total_amount: string;
  expires_at: string;
};

type Ticket = {
  id: string;
};

type PaymentResult = {
  reservation: Reservation;
  decision: "APPROVED" | "DECLINED";
  tickets: Ticket[];
};

type CheckoutState = "READY" | "RESERVING" | "PENDING" | "PAYING" | "APPROVED" | "DECLINED" | "EXPIRED";

export function CheckoutFlow({ eventId, quantity }: { eventId: string; quantity: number }) {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [state, setState] = useState<CheckoutState>("READY");
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [paymentToken, setPaymentToken] = useState<"tok_approved" | "tok_declined" | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const guard = guardRoute(["CUSTOMER"]);
    if (!guard.allowed) {
      router.replace(guard.redirectTo);
      return;
    }
    setAccessToken(guard.session.accessToken);
  }, [router]);

  const expire = useCallback(() => {
    setState((current) => (current === "PENDING" ? "EXPIRED" : current));
  }, []);

  async function reserve() {
    if (!accessToken || state !== "READY") return;
    setError(null);
    setState("RESERVING");
    try {
      const created = await apiMutation<Reservation, { quantity: number }>(
        `/events/${encodeURIComponent(eventId)}/reservations`,
        { accessToken, body: { quantity } },
      );
      setReservation(created);
      setIdempotencyKey(crypto.randomUUID());
      setState("PENDING");
    } catch (caught) {
      setError(message(caught, "Não foi possível criar a reserva."));
      setState("READY");
    }
  }

  async function pay(requestedToken: "tok_approved" | "tok_declined") {
    if (!accessToken || !reservation || !idempotencyKey || state !== "PENDING") return;
    const stableToken = paymentToken ?? requestedToken;
    setPaymentToken(stableToken);
    setError(null);
    setState("PAYING");
    try {
      const result = await apiMutation<PaymentResult, { payment_token: typeof stableToken }>(
        `/reservations/${encodeURIComponent(reservation.id)}/payment`,
        {
          accessToken,
          body: { payment_token: stableToken },
          idempotencyKey,
        },
      );
      setReservation(result.reservation);
      setTickets(result.tickets);
      setState(result.decision);
    } catch (caught) {
      setError(message(caught, "Não foi possível processar o pagamento."));
      setState("PENDING");
    }
  }

  return (
    <section className="checkout-flow" aria-live="polite" aria-busy={state === "RESERVING" || state === "PAYING"}>
      <ul className="ledger">
        <LedgerRow label="Quantidade" value={quantity} />
        {reservation ? <LedgerRow label="Total" value={`R$ ${reservation.total_amount}`} /> : null}
      </ul>

      {state === "READY" || state === "RESERVING" ? (
        <button type="button" onClick={reserve} disabled={!accessToken || state === "RESERVING"}>
          {state === "RESERVING" ? "Reservando…" : "Criar reserva"}
        </button>
      ) : null}

      {reservation && (state === "PENDING" || state === "PAYING") ? (
        <div className="checkout-flow__actions">
          <Status status="PENDING" />
          <Countdown expiresAt={reservation.expires_at} onExpire={expire} />
          <p>Use um dos tokens seguros de demonstração:</p>
          {paymentToken ? (
            <button type="button" onClick={() => pay(paymentToken)} disabled={state === "PAYING"}>
              {state === "PAYING" ? "Processando…" : "Repetir tentativa idempotente"}
            </button>
          ) : (
            <>
              <button type="button" onClick={() => pay("tok_approved")} disabled={state === "PAYING"}>
                {state === "PAYING" ? "Processando…" : "Simular aprovação"}
              </button>{" "}
              <button type="button" className="button button--ghost" onClick={() => pay("tok_declined")} disabled={state === "PAYING"}>
                Simular recusa
              </button>
            </>
          )}
        </div>
      ) : null}

      {state === "APPROVED" ? (
        <div role="status">
          <Status status="APPROVED" />
          <p>{tickets.length} ingresso(s) emitido(s).</p>
          <Link className="button button--primary" href="/customer/tickets">Ver meus ingressos</Link>
        </div>
      ) : null}
      {state === "DECLINED" ? (
        <div role="status">
          <Status status="DECLINED" />
          <p>Pagamento recusado. Nenhum ingresso foi emitido e a disponibilidade foi restaurada.</p>
          <Link className="button button--ghost" href={`/events/${eventId}`}>Voltar ao evento</Link>
        </div>
      ) : null}
      {state === "EXPIRED" ? (
        <div role="status">
          <Status status="EXPIRED" />
          <p>O prazo terminou. Crie uma nova reserva a partir do evento.</p>
          <Link className="button button--ghost" href={`/events/${eventId}`}>Voltar ao evento</Link>
        </div>
      ) : null}
      {error ? <p role="alert">{error}</p> : null}
    </section>
  );
}

function message(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}
