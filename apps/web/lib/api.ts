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
