"use client";

import { useEffect, useState } from "react";

export function remainingSeconds(expiresAt: string, now = Date.now()): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 1000));
}

function clock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function Countdown({ expiresAt, onExpire }: { expiresAt: string; onExpire: () => void }) {
  const [seconds, setSeconds] = useState(() => remainingSeconds(expiresAt));

  useEffect(() => {
    const update = () => {
      const next = remainingSeconds(expiresAt);
      setSeconds(next);
      if (next === 0) onExpire();
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt, onExpire]);

  return (
    <p className="code-data" role="timer" aria-live={seconds <= 60 ? "polite" : "off"}>
      {seconds > 0 ? `Tempo restante: ${clock(seconds)}` : "Reserva expirada"}
    </p>
  );
}
