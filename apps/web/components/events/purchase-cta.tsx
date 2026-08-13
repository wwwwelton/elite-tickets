"use client";

import Link from "next/link";
import { useSession } from "@/lib/session";

export function PurchaseCta({
  eventId,
  soldOut = false,
}: {
  eventId: string;
  soldOut?: boolean;
}) {
  const { session, ready } = useSession();

  if (soldOut) {
    return (
      <button className="btn btn-outline-light btn-lg w-100" type="button" disabled>
        Esgotado
      </button>
    );
  }

  if (!ready) {
    return (
      <button className="btn btn-primary btn-lg w-100" type="button" disabled>
        Carregando…
      </button>
    );
  }

  if (!session) {
    return (
      <div className="d-grid gap-2">
        <Link
          className="btn btn-primary btn-lg"
          href={`/login?next=${encodeURIComponent(`/events/${eventId}/reserve`)}`}
        >
          Entrar para comprar
        </Link>
        <Link className="btn btn-outline-light" href="/register">
          Criar conta de cliente
        </Link>
      </div>
    );
  }

  if (session.role !== "CUSTOMER") {
    return (
      <div className="alert alert-warning mb-0" role="status">
        Você entrou como {session.role.toLowerCase()}. Apenas contas de cliente
        podem comprar ingressos.
      </div>
    );
  }

  return (
    <Link className="btn btn-primary btn-lg w-100" href={`/events/${eventId}/reserve`}>
      Escolher ingressos
    </Link>
  );
}
