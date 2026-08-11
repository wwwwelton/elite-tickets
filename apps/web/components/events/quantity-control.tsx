"use client";

import Link from "next/link";
import { useState } from "react";

export function QuantityControl({ available, eventId }: { available: number; eventId: string }) {
  const maximum = Math.max(1, available);
  const [quantity, setQuantity] = useState(1);
  const soldOut = available < 1;
  return (
    <section aria-labelledby="quantity-title">
      <h2 id="quantity-title" className="headline-sm">
        Quantidade
      </h2>
      <div className="ledger__row">
        <button
          type="button"
          className="button button--ghost"
          onClick={() => setQuantity((current) => Math.max(1, current - 1))}
          disabled={soldOut || quantity === 1}
          aria-label="Diminuir quantidade"
        >
          −
        </button>
        <output className="ledger__value" aria-live="polite">
          {soldOut ? 0 : quantity}
        </output>
        <button
          type="button"
          className="button button--ghost"
          onClick={() => setQuantity((current) => Math.min(maximum, current + 1))}
          disabled={soldOut || quantity >= maximum}
          aria-label="Aumentar quantidade"
        >
          +
        </button>
      </div>
      {soldOut ? (
        <p role="status">Ingressos esgotados.</p>
      ) : (
        <Link
          className="button button--primary"
          href={`/customer/checkout/${eventId}?quantity=${quantity}`}
        >
          Reservar ingressos
        </Link>
      )}
    </section>
  );
}
