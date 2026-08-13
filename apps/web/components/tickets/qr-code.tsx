"use client";

import { useMemo } from "react";
import { encodeQr } from "@/lib/qr";

export function QrCode({
  value,
  label = "Ticket QR credential",
}: {
  value: string;
  label?: string;
}) {
  const matrix = useMemo(() => encodeQr(value), [value]);

  if (!matrix) {
    return (
      <div className="credential border p-3 bg-black" aria-label={label}>
        {value}
      </div>
    );
  }

  const size = matrix.length;
  const quiet = 4;
  const span = size + quiet * 2;

  return (
    <svg
      className="qr"
      viewBox={`0 0 ${span} ${span}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
    >
      <rect width={span} height={span} fill="#ffffff" />
      {matrix.map((row, y) =>
        row.map((dark, x) =>
          dark ? (
            <rect
              key={`${x}-${y}`}
              x={x + quiet}
              y={y + quiet}
              width={1}
              height={1}
              fill="#000000"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}
