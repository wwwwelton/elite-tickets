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

  if (error) return <p role="alert">{error}</p>;
  if (!tickets) return <p role="status">Carregando ingressos…</p>;
  if (ticketId) {
    const ticket = tickets.find((candidate) => candidate.id === ticketId);
    return ticket ? <CustomerTicketView ticket={ticket} /> : <p role="alert">Ingresso não encontrado.</p>;
  }
  if (tickets.length === 0) return <p role="status">Você ainda não possui ingressos.</p>;
  return (
    <div className="page-grid" style={{ width: "100%" }}>
      {tickets.map((ticket) => <CustomerTicketView compact key={ticket.id} ticket={ticket} />)}
    </div>
  );
}
