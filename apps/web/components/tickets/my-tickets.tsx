"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CustomerTicketView, ticketError, type CustomerTicket } from "@/components/tickets/ticket";
import { apiRequest } from "@/lib/api";
import { guardRoute } from "@/lib/auth";

export function MyTickets({ ticketId }: { ticketId?: string }) {
  const router = useRouter();
  const [tickets, setTickets] = useState<CustomerTicket[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const guard = guardRoute(["CUSTOMER"]);
    if (!guard.allowed) {
      router.replace(guard.redirectTo);
      return;
    }
    apiRequest<CustomerTicket[]>("/me/tickets", {
      accessToken: guard.session.accessToken,
      cache: "no-store",
    })
      .then(setTickets)
      .catch((caught) => setError(ticketError(caught)));
  }, [router]);

  if (error) return <p role="alert" aria-atomic="true">{error}</p>;
  if (!tickets) {
    return <p role="status" aria-atomic="true" aria-busy="true">Carregando ingressos…</p>;
  }
  if (ticketId) {
    const ticket = tickets.find((candidate) => candidate.id === ticketId);
    return ticket ? (
      <CustomerTicketView ticket={ticket} />
    ) : (
      <p role="alert" aria-atomic="true">Ingresso não encontrado.</p>
    );
  }
  if (tickets.length === 0) {
    return <p role="status" aria-atomic="true">Você ainda não possui ingressos.</p>;
  }
  return (
    <section className="ticket__details-stack" aria-label="Ingressos emitidos">
      {tickets.map((ticket) => <CustomerTicketView compact key={ticket.id} ticket={ticket} />)}
    </section>
  );
}
