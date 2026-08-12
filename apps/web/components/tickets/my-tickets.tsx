"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CustomerTicketView, ticketError, type CustomerTicket } from "@/components/tickets/ticket";
import { RouteAccessState } from "@/components/auth/route-access-state";
import { apiRequest } from "@/lib/api";
import { guardRoute } from "@/lib/auth";

export function MyTickets({ ticketId }: { ticketId?: string }) {
  const [tickets, setTickets] = useState<CustomerTicket[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accessState, setAccessState] = useState<"auth_required" | "access_denied" | null>(null);

  useEffect(() => {
    const guard = guardRoute(["CUSTOMER"]);
    if (!guard.allowed) {
      setAccessState(guard.reason);
      return;
    }
    apiRequest<CustomerTicket[]>("/me/tickets", {
      accessToken: guard.session.accessToken,
      cache: "no-store",
    })
      .then(setTickets)
      .catch((caught) => setError(ticketError(caught)));
  }, []);

  if (accessState === "auth_required") {
    return (
      <RouteAccessState
        title="Acesso necessário"
        message="Entre para ver seus ingressos"
        actionHref="/login"
        actionLabel="Entrar"
      />
    );
  }
  if (accessState === "access_denied") {
    return (
      <RouteAccessState
        title="Acesso negado"
        message="Esta área pertence ao perfil atual"
        actionHref="/"
        actionLabel="Voltar ao início"
      />
    );
  }
  if (error) return <p role="alert" aria-atomic="true">{error}</p>;
  if (!tickets) {
    return <p role="status" aria-atomic="true" aria-busy="true">Carregando ingressos…</p>;
  }
  const sessionActions = (
    <nav className="ticket__actions" aria-label="Atalhos da conta">
      <Link className="button button--ghost" href="/">
        Explorar eventos
      </Link>
      <Link className="button button--ghost" href="/customer/tickets">
        Recarregar ingressos
      </Link>
    </nav>
  );
  if (ticketId) {
    const ticket = tickets.find((candidate) => candidate.id === ticketId);
    return ticket ? (
      <>
        {sessionActions}
        <CustomerTicketView ticket={ticket} />
      </>
    ) : (
      <p role="alert" aria-atomic="true">Ingresso não encontrado.</p>
    );
  }
  if (tickets.length === 0) {
    return (
      <div className="ticket__details-stack">
        {sessionActions}
        <p role="status" aria-atomic="true">Você ainda não possui ingressos.</p>
      </div>
    );
  }
  return (
    <section className="ticket__details-stack" aria-label="Ingressos emitidos">
      {sessionActions}
      <div className="my-tickets-list ticket__details-stack">
        {tickets.map((ticket) => <CustomerTicketView compact key={ticket.id} ticket={ticket} />)}
      </div>
    </section>
  );
}
