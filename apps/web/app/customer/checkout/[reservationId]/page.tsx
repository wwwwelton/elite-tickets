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
          ? "Esta reserva não pode mais ser paga - ela expirou ou já foi processada. Inicie um novo pedido para continuar."
          : caught instanceof ApiError
            ? caught.message
            : "O pagamento não pôde ser enviado. Tente novamente.",
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
        title="Os detalhes do pedido não estão mais neste navegador"
        description="Os resumos de reserva ficam apenas na aba atual. Selecione os ingressos novamente para reiniciar o checkout."
        action={
          <Link className="btn btn-primary" href="/">
            Voltar para a descoberta
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
        <h1 className="display-5 text-cream mb-0">Revisar e pagar</h1>
        <HoldCountdown
          expiresAt={snapshot.reservation.expires_at}
          onExpire={handleExpire}
        />
      </header>

      <section className="card p-3 d-grid gap-2" aria-label="Customer information">
        <h2 className="h5 text-cream mb-0">Cliente</h2>
        <dl className="row mb-0">
          <dt className="col-5 fw-normal text-secondary">Nome</dt>
          <dd className="col-7 font-mono mb-0">{session?.displayName}</dd>
          <dt className="col-5 fw-normal text-secondary">E-mail</dt>
          <dd className="col-7 font-mono mb-0">{session?.email}</dd>
        </dl>
        <p className="text-secondary small mb-0">
          Os ingressos são emitidos para a conta autenticada.
        </p>
      </section>

      <OrderStub
        event={snapshot.event}
        reservation={snapshot.reservation}
        selection={snapshot.selection}
      />

      <section className="card p-3 d-grid gap-3" aria-label="Payment method">
        <div>
          <h2 className="h5 text-cream mb-1">Pagamento</h2>
          <p className="text-secondary small mb-0">
            O pagamento é simulado pelo backend. Escolha o resultado que você
            deseja testar.
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
              <span className="d-block text-cream">Cartão final 4242</span>
              <span className="d-block text-secondary small">
                Aprovação simulada
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
              <span className="d-block text-cream">Cartão final 0002</span>
              <span className="d-block text-secondary small">
                Recusa simulada
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
            O bloqueio da reserva expirou. Inicie um novo pedido para comprar estes ingressos.
          </div>
        ) : null}

        <button
          className="btn btn-primary btn-lg"
          type="button"
          disabled={pending || expired}
          onClick={handlePayment}
        >
          {pending
            ? "Enviando pagamento…"
            : `Pay ${formatMoney(snapshot.reservation.total_amount)}`}
        </button>

        <Link className="btn btn-outline-light" href={`/events/${snapshot.event.id}`}>
          Voltar ao evento
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
        <p className="eyebrow mb-1">Pedido {reservationId.slice(0, 8)}</p>
        <h1 className="display-4 text-danger mb-1">Pagamento recusado</h1>
        <p className="text-secondary mb-0">
          O backend encerrou esta reserva, então ela não pode mais ser paga. Seus
          lugares foram liberados - escolha novamente para tentar outro método.
        </p>
      </div>

      <div className="d-grid gap-2">
        <Link className="btn btn-primary btn-lg" href={`/events/${eventId}/reserve`}>
          Iniciar novo pedido
        </Link>
        <Link className="btn btn-outline-light" href={`/events/${eventId}`}>
          Voltar ao evento
        </Link>
      </div>
    </div>
  );
}

function ApprovedPanel({ payment }: { payment: PaymentApi }) {
  return (
    <div className="d-grid gap-4 text-center">
      <div>
        <p className="eyebrow mb-1">Pedido {payment.reservation.id.slice(0, 8)}</p>
        <h1 className="display-4 text-cream mb-1">Pagamento aprovado</h1>
        <p className="text-secondary mb-0">
          {payment.tickets.length} ingresso(s) emitido(s) para{" "}
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
          Ver meus ingressos
        </Link>
        <Link className="btn btn-outline-light" href="/">
          Continuar explorando
        </Link>
      </div>
    </div>
  );
}
