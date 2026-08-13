import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  createReservation,
  fetchMyTickets,
  fetchPublicEvents,
  submitPayment,
  validateGateTicket,
} from "@/lib/api";
import { clearStoredSession, writeStoredSession } from "@/lib/auth";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("api client", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    clearStoredSession();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the public event search as a query parameter", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ items: [], page: 1, size: 20, total: 0, has_more: false }),
    );

    await fetchPublicEvents({ query: "neon" });

    expect(fetchMock.mock.calls[0][0]).toContain("/events?query=neon");
  });

  it("omits the Authorization header on public routes", async () => {
    writeStoredSession({
      accessToken: "token",
      expiresAt: Date.now() + 60_000,
      role: "CUSTOMER",
      email: "customer@example.com",
      displayName: "Jane",
    });
    fetchMock.mockResolvedValue(
      jsonResponse({ items: [], page: 1, size: 20, total: 0, has_more: false }),
    );

    await fetchPublicEvents();

    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers.Authorization).toBeUndefined();
  });

  it("attaches the bearer token on protected routes", async () => {
    writeStoredSession({
      accessToken: "token-123",
      expiresAt: Date.now() + 60_000,
      role: "CUSTOMER",
      email: "customer@example.com",
      displayName: "Jane",
    });
    fetchMock.mockResolvedValue(jsonResponse([]));

    await fetchMyTickets();

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer token-123",
    );
  });

  it("sends only the quantity when creating a reservation", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 201));

    await createReservation("event-1", 3);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/events/event-1/reservations");
    expect(JSON.parse(init.body)).toEqual({ quantity: 3 });
  });

  it("sends a stable idempotency key per payment decision", async () => {
    fetchMock.mockImplementation(async () => jsonResponse({}));

    await submitPayment("reservation-1", "tok_approved");
    await submitPayment("reservation-1", "tok_approved");

    const first = fetchMock.mock.calls[0][1].headers["Idempotency-Key"];
    const second = fetchMock.mock.calls[1][1].headers["Idempotency-Key"];
    expect(first).toBe(second);
  });

  it("sends an idempotency key on gate validation", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ result: "VALID", attempted_at: "2026-08-13T18:00:00Z" }),
    );

    await validateGateTicket("event-1", "credential", "key-1");

    expect(fetchMock.mock.calls[0][1].headers["Idempotency-Key"]).toBe("key-1");
  });

  it("raises a typed error carrying the backend status and code", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { error: { code: "conflict", message: "Inventory conflict" } },
        409,
      ),
    );

    await expect(createReservation("event-1", 2)).rejects.toMatchObject({
      status: 409,
      code: "conflict",
      message: "Inventory conflict",
    });
  });

  it("still raises an ApiError when the body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("gateway down", { status: 502 }));

    await expect(fetchMyTickets()).rejects.toBeInstanceOf(ApiError);
  });
});
