import { readStoredSession } from "./auth";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

const PUBLIC_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";
const SERVER_API_BASE =
  process.env.API_INTERNAL_BASE_URL ?? "http://api:8000/api/v1";

function getApiBase() {
  return typeof window === "undefined" ? SERVER_API_BASE : PUBLIC_API_BASE;
}

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {}, auth = false } = options;
  const requestHeaders: Record<string, string> = { ...headers };

  if (body !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (auth) {
    const session = readStoredSession();
    if (session) {
      requestHeaders.Authorization = `Bearer ${session.accessToken}`;
    }
  }

  const response = await fetch(`${getApiBase()}${path}`, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function toApiError(response: Response) {
  try {
    const payload = (await response.json()) as {
      error?: { code?: string; message?: string };
      detail?: unknown;
    };
    const code = payload.error?.code ?? String(response.status);
    const message =
      payload.error?.message ?? describeStatus(response.status);
    return new ApiError(response.status, code, message);
  } catch {
    return new ApiError(
      response.status,
      String(response.status),
      describeStatus(response.status),
    );
  }
}

function describeStatus(status: number) {
  switch (status) {
    case 401:
      return "Your session is no longer valid. Sign in again to continue.";
    case 403:
      return "This action is not permitted for the current role.";
    case 404:
      return "The requested resource was not found.";
    case 409:
      return "This operation conflicts with the current state.";
    case 422:
      return "The supplied data is invalid.";
    default:
      return "The operation could not be completed.";
  }
}

/* Authentication */

export type SessionRole = "CUSTOMER" | "ORGANIZER" | "GATE";

export type TokenApi = {
  access_token: string;
  token_type: string;
  expires_in: number;
  role: SessionRole;
};

export function login(email: string, password: string) {
  return request<TokenApi>("/auth/token", {
    method: "POST",
    body: { email, password },
  });
}

export function register(payload: {
  email: string;
  password: string;
  display_name: string;
  role: SessionRole;
}) {
  return request<TokenApi>("/auth/register", {
    method: "POST",
    body: payload,
  });
}

/* Public events */

export type PublicEventApi = {
  id: string;
  state?: string;
  title: string;
  poster_url?: string | null;
  starts_at?: string;
  ends_at?: string;
  venue_name?: string;
  capacity?: number;
  sold_quantity?: number;
  available_quantity?: number;
  price?: string;
  overview?: string;
};

export type PublicEventPageApi = {
  items: PublicEventApi[];
  page: number;
  total: number;
};

export function fetchPublicEvents(params: { query?: string; page?: number } = {}) {
  const search = new URLSearchParams();
  if (params.query) {
    search.set("query", params.query);
  }
  if (params.page && params.page > 1) {
    search.set("page", String(params.page));
  }
  const suffix = search.toString();
  return request<PublicEventPageApi>(`/events${suffix ? `?${suffix}` : ""}`);
}

export function fetchPublicEvent(eventId: string) {
  return request<PublicEventApi>(`/events/${eventId}`);
}

/* Reservations and payment */

export type ReservationApi = {
  id: string;
  event_id: string;
  status: string;
  quantity: number;
  total_amount: string;
  expires_at: string;
};

export type TicketApi = {
  id: string;
  event_id: string;
  owner_name: string;
  status: "ACTIVE" | "USED" | "CANCELLED";
  issued_at: string;
  used_at?: string | null;
  qr_credential: string;
};

export type PaymentApi = {
  reservation: ReservationApi;
  decision: "APPROVED" | "DECLINED";
  tickets: TicketApi[];
};

export function createReservation(eventId: string, quantity: number) {
  return request<ReservationApi>(`/events/${eventId}/reservations`, {
    method: "POST",
    body: { quantity },
    auth: true,
  });
}

export function submitPayment(
  reservationId: string,
  paymentToken: "tok_approved" | "tok_declined",
) {
  return request<PaymentApi>(`/reservations/${reservationId}/payment`, {
    method: "POST",
    body: { payment_token: paymentToken },
    headers: { "Idempotency-Key": `${reservationId}:${paymentToken}` },
    auth: true,
  });
}

/* Tickets and sharing */

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
  return request<TicketApi[]>("/me/tickets", { auth: true });
}

export function createTicketShare(ticketId: string) {
  return request<TicketShareApi>(`/me/tickets/${ticketId}/share`, {
    method: "POST",
    body: {},
    auth: true,
  });
}

export function fetchSharedTicket(shareToken: string) {
  return request<SharedTicketApi>(`/shared/tickets/${shareToken}`);
}

/* Organizer */

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

export function fetchOrganizerEvents() {
  return request<OrganizerEventApi[]>("/organizer/events", { auth: true });
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
  return request<OrganizerEventApi>("/events", {
    method: "POST",
    body: payload,
    auth: true,
  });
}

export function publishOrganizerEvent(eventId: string) {
  return request<OrganizerEventApi>(`/events/${eventId}/publish`, {
    method: "POST",
    body: {},
    auth: true,
  });
}

export function cancelOrganizerEvent(eventId: string) {
  return request<OrganizerEventApi>(`/events/${eventId}/cancel`, {
    method: "POST",
    body: {},
    auth: true,
  });
}

/* Catalog */

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
  source: string;
};

export type CatalogPageApi = {
  items: CatalogEventApi[];
  page: number;
  size: number;
  total: number;
  has_more: boolean;
};

export function fetchCatalogEvents(keyword: string) {
  const search = new URLSearchParams({ keyword });
  return request<CatalogPageApi>(`/catalog/events?${search.toString()}`, {
    auth: true,
  });
}

export function fetchCatalogEventDetail(externalId: string) {
  return request<CatalogEventApi>(`/catalog/events/${externalId}`, {
    auth: true,
  });
}

/* Gate */

export type GateEventApi = PublicEventApi;

export type GateValidationApi = {
  result: "VALID" | "INVALID" | "ALREADY_USED" | "WRONG_EVENT";
  attempted_at: string;
};

export function fetchGateEvents() {
  return request<GateEventApi[]>("/gate/events", { auth: true });
}

export function validateGateTicket(
  eventId: string,
  credential: string,
  idempotencyKey: string,
) {
  return request<GateValidationApi>(`/gate/events/${eventId}/validate`, {
    method: "POST",
    body: { credential },
    headers: { "Idempotency-Key": idempotencyKey },
    auth: true,
  });
}
