import type { PublicEventApi, ReservationApi } from "@/lib/api";
import { formatDate, formatMoney, formatTime } from "@/lib/format";

export function OrderStub({
  event,
  reservation,
  selection,
}: {
  event: PublicEventApi;
  reservation: ReservationApi;
  selection: string[];
}) {
  return (
    <section className="stub" aria-label="Resumo do pedido">
      <div className="p-3 p-lg-4 d-grid gap-2">
        <div className="d-flex justify-content-between align-items-start gap-2">
          <span className="badge text-cream">
            {selection.length > 0 ? "Selecionado" : "Ingresso geral"}
          </span>
          <span className="font-mono small text-secondary">QTD: {reservation.quantity}</span>
        </div>
        <h2 className="h3 text-cream mb-0">{event.title}</h2>
        <p className="font-mono small text-secondary mb-0">
          {event.venue_name ?? "Local a confirmar"}
        </p>
      </div>

      <div className="perf d-flex align-items-center px-3">
        <span className="perf__line flex-grow-1" aria-hidden="true" />
      </div>

      <div className="p-3 p-lg-4 d-grid gap-3">
        <dl className="row mb-0">
          <dt className="col-6 eyebrow">Data</dt>
          <dd className="col-6 eyebrow text-end">Hora</dd>
          <dd className="col-6 font-mono mb-0">{formatDate(event.starts_at)}</dd>
          <dd className="col-6 font-mono text-end mb-0">
            {formatTime(event.starts_at)}
          </dd>
        </dl>

        {selection.length > 0 ? (
          <p className="font-mono small text-secondary mb-0">
            {selection.join(" · ")}
          </p>
        ) : null}

        <hr className="my-0" />

        <dl className="row mb-0">
          <dt className="col-8 fw-normal text-secondary">
            Ingressos (×{reservation.quantity})
          </dt>
          <dd className="col-4 text-end font-mono">
            {formatMoney(reservation.total_amount)}
          </dd>
          <dt className="col-8 eyebrow align-self-center mb-0">Total</dt>
          <dd className="col-4 text-end h3 text-cream mb-0">
            {formatMoney(reservation.total_amount)}
          </dd>
        </dl>
      </div>
    </section>
  );
}
