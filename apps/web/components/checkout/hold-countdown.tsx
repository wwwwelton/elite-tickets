"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/format";

export function HoldCountdown({
  expiresAt,
  onExpire,
}: {
  expiresAt: string;
  onExpire?: () => void;
}) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, new Date(expiresAt).getTime() - Date.now()),
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = Math.max(0, new Date(expiresAt).getTime() - Date.now());
      setRemaining(next);
      if (next === 0) {
        window.clearInterval(timer);
        onExpire?.();
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [expiresAt, onExpire]);

  return (
    <p className="eyebrow mb-0" aria-live="polite">
      {remaining === 0
        ? "Reservation hold expired"
        : `Simulated checkout // ${formatCountdown(remaining)} remaining`}
    </p>
  );
}
