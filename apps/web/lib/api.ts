export type ApiError = {
  error?: {
    code?: string;
    message?: string;
  };
};

const PUBLIC_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";
const SERVER_API_BASE =
  process.env.API_INTERNAL_BASE_URL ?? "http://api:8000/api/v1";

function getApiBase() {
  return typeof window === "undefined" ? SERVER_API_BASE : PUBLIC_API_BASE;
}

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${getApiBase()}${path}`, {
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

export type PublicEventPageApi = {
  items: PublicEventApi[];
  page: number;
  size: number;
  total: number;
  has_more: boolean;
};

export async function fetchPublicEvents() {
  return getJson<PublicEventPageApi>("/events");
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

export type GateEventApi = {
  id: string;
  title: string;
  starts_at?: string;
  venue_name?: string;
  price?: string;
  poster_url?: string;
  overview?: string;
};

export type GateValidationApi = {
  result: "VALID" | "INVALID" | "ALREADY_USED" | "WRONG_EVENT";
  attempted_at: string;
};

export function fetchGateEvents() {
  return getJson<GateEventApi[]>("/gate/events");
}

export function validateGateTicket(
  eventId: string,
  credential: string,
  idempotencyKey: string,
) {
  return postJson<GateValidationApi>(
    `/gate/events/${eventId}/validate`,
    { credential },
    {
      "Idempotency-Key": idempotencyKey,
    },
  );
}

export type CatalogEventApi = {
  external_id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  external_url?: string | null;
  category?: string | null;
  date?: string | null;
  venue_name?: string | null;
  city?: string | null;
  country_code?: string | null;
  source: "ticketmaster";
};

export type CatalogPageApi = {
  items: CatalogEventApi[];
  page: number;
  size: number;
  total: number;
  has_more: boolean;
};

export type OrganizerEventApi = {
  id: string;
  state: string;
  title: string;
  poster_url?: string | null;
  starts_at: string;
  ends_at: string;
  timezone: string;
  venue_name: string;
  venue_address: string;
  capacity: number;
  reserved_quantity: number;
  sold_quantity: number;
  available_quantity: number;
  price: string;
};

export function fetchCatalogEvents(keyword: string) {
  const query = new URLSearchParams({ keyword });
  return getJson<CatalogPageApi>(`/catalog/events?${query.toString()}`);
}

export function fetchCatalogEventDetail(externalId: string) {
  return getJson<CatalogEventApi>(`/catalog/events/${externalId}`);
}

export function fetchOrganizerEvents() {
  return getJson<OrganizerEventApi[]>("/organizer/events");
}

export function createOrganizerEvent(payload: {
  external_id: string;
  venue_name: string;
  venue_address: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  capacity: number;
  price: string;
}) {
  return postJson<OrganizerEventApi>("/events", payload);
}

export function publishOrganizerEvent(eventId: string) {
  return postJson<OrganizerEventApi>(`/events/${eventId}/publish`, {});
}

export function cancelOrganizerEvent(eventId: string) {
  return postJson<OrganizerEventApi>(`/events/${eventId}/cancel`, {});
}
