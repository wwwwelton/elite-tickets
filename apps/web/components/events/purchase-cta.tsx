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
        Sold out
      </button>
    );
  }

  if (!ready) {
    return (
      <button className="btn btn-primary btn-lg w-100" type="button" disabled>
        Loading…
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
          Sign in to buy
        </Link>
        <Link className="btn btn-outline-light" href="/register">
          Create a customer account
        </Link>
      </div>
    );
  }

  if (session.role !== "CUSTOMER") {
    return (
      <div className="alert alert-warning mb-0" role="status">
        You are signed in as {session.role.toLowerCase()}. Only customer accounts
        can buy tickets.
      </div>
    );
  }

  return (
    <Link className="btn btn-primary btn-lg w-100" href={`/events/${eventId}/reserve`}>
      Choose tickets
    </Link>
  );
}
