export type ApiError = {
  error?: {
    code?: string;
    message?: string;
  };
};

const API_BASE = "/api/v1";

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw (await response.json()) as ApiError;
  }

  return (await response.json()) as T;
}

export function getJson<T>(path: string) {
  return requestJson<T>(path, { method: "GET" });
}

export function postJson<T>(path: string, body: unknown, headers?: HeadersInit) {
  return requestJson<T>(path, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

export type PublicEventApi = {
  id: string;
  title: string;
  starts_at?: string;
  venue_name?: string;
  price?: string;
  poster_url?: string;
  overview?: string;
};

export async function fetchPublicEvents() {
  return getJson<PublicEventApi[]>("/events");
}

export async function fetchPublicEvent(eventId: string) {
  return getJson<PublicEventApi>(`/events/${eventId}`);
}

export type ReservationApi = {
  id: string;
  event_id: string;
  status: string;
  quantity: number;
  total_amount: string;
  expires_at: string;
};

export type PaymentApi = {
  reservation: ReservationApi;
  decision: "APPROVED" | "DECLINED";
  tickets: Array<{
    id: string;
    event_id: string;
    owner_name: string;
    status: string;
    issued_at: string;
    used_at?: string | null;
    qr_credential: string;
  }>;
};

export function createReservation(eventId: string, quantity: number) {
  return postJson<ReservationApi>(`/events/${eventId}/reservations`, {
    quantity,
  });
}

export function submitPayment(
  reservationId: string,
  payment_token: "tok_approved" | "tok_declined",
) {
  return postJson<PaymentApi>(
    `/reservations/${reservationId}/payment`,
    { payment_token },
    {
      "Idempotency-Key": `${reservationId}:${payment_token}`,
    },
  );
}

export type TicketApi = {
  id: string;
  event_id: string;
  owner_name: string;
  status: "ACTIVE" | "USED" | "CANCELLED";
  issued_at: string;
  used_at?: string | null;
  qr_credential: string;
};

export type TicketShareApi = {
  share_url: string;
};

export type SharedTicketApi = {
  id: string;
  event_id: string;
  event_title: string;
  owner_name: string;
  status: "ACTIVE" | "USED" | "CANCELLED";
  issued_at: string;
  used_at?: string | null;
  qr_credential: string;
};

export function fetchMyTickets() {
  return getJson<TicketApi[]>("/me/tickets");
}

export function createTicketShare(ticketId: string) {
  return postJson<TicketShareApi>(`/me/tickets/${ticketId}/share`, {});
}

export function fetchSharedTicket(shareToken: string) {
  return getJson<SharedTicketApi>(`/shared/tickets/${shareToken}`);
}
