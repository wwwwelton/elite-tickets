const DATE_LOCALE = "pt-BR";

export function formatDate(iso?: string | null) {
  if (!iso) {
    return "Data a ser anunciada";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Data a ser anunciada";
  }
  return date
    .toLocaleDateString(DATE_LOCALE, {
      month: "short",
      day: "2-digit",
      year: "numeric",
    })
    .toUpperCase();
}

export function formatShortDate(iso?: string | null) {
  if (!iso) {
    return "A definir";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "A definir";
  }
  return date
    .toLocaleDateString(DATE_LOCALE, { month: "short", day: "2-digit" })
    .toUpperCase();
}

export function formatTime(iso?: string | null) {
  if (!iso) {
    return "--:--";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }
  return date.toLocaleTimeString(DATE_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatDateTime(iso?: string | null) {
  return `${formatDate(iso)} · ${formatTime(iso)}`;
}

export function formatMoney(amount?: string | number | null) {
  if (amount === undefined || amount === null || amount === "") {
    return "—";
  }
  const value = typeof amount === "number" ? amount : Number(amount);
  if (Number.isNaN(value)) {
    return "—";
  }
  return value.toLocaleString(DATE_LOCALE, {
    style: "currency",
    currency: "BRL",
  });
}

export function multiplyPrice(price: string | undefined, quantity: number) {
  const unit = Number(price ?? 0);
  if (Number.isNaN(unit)) {
    return 0;
  }
  return unit * quantity;
}

export function formatCountdown(msRemaining: number) {
  const total = Math.max(0, Math.floor(msRemaining / 1000));
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}
