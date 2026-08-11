import { expect, test } from "@playwright/test";

const webUrl = process.env.E2E_WEB_URL ?? "http://127.0.0.1:3000";
const apiUrl = process.env.E2E_API_URL ?? "http://127.0.0.1:8000/api/v1";

test("anonymous shared ticket stays read-only and expires after admission", async ({ page, request }) => {
  const customerToken = await login(request, "customer@demo.elitetickets.local");
  const eventsResponse = await request.get(`${apiUrl}/events`);
  expect(eventsResponse.ok()).toBeTruthy();
  const events = (await eventsResponse.json()) as { items: Array<{ id: string }> };
  expect(events.items.length).toBeGreaterThan(0);
  const selectedEvent = events.items[0];
  if (!selectedEvent) throw new Error("A published demo event is required");
  const eventId = selectedEvent.id;

  const reservationResponse = await request.post(`${apiUrl}/events/${eventId}/reservations`, {
    headers: authorization(customerToken),
    data: { quantity: 1 },
  });
  expect(reservationResponse.status()).toBe(201);
  const reservation = (await reservationResponse.json()) as { id: string };
  const paymentResponse = await request.post(`${apiUrl}/reservations/${reservation.id}/payment`, {
    headers: {
      ...authorization(customerToken),
      "Idempotency-Key": crypto.randomUUID(),
    },
    data: { payment_token: "tok_approved" },
  });
  expect(paymentResponse.ok()).toBeTruthy();
  const payment = (await paymentResponse.json()) as {
    tickets: Array<{ id: string; owner_name: string; qr_credential: string }>;
  };
  expect(payment.tickets).toHaveLength(1);
  const ticket = payment.tickets[0];
  if (!ticket) throw new Error("Approved payment did not issue a ticket");

  const shareResponse = await request.post(`${apiUrl}/me/tickets/${ticket.id}/share`, {
    headers: authorization(customerToken),
  });
  expect(shareResponse.ok()).toBeTruthy();
  const share = (await shareResponse.json()) as { share_url: string };
  const sharedPath = new URL(share.share_url).pathname;

  const pageResponse = await page.goto(`${webUrl}${sharedPath}`);
  expect(pageResponse).not.toBeNull();
  expect(pageResponse?.headers()["cache-control"]).toContain("no-store");
  expect(pageResponse?.headers()["referrer-policy"]).toBe("no-referrer");
  await expect(page.getByText("Visualização pública somente leitura", { exact: false })).toBeVisible();
  await expect(page.getByText(ticket.owner_name, { exact: true })).toBeVisible();
  await expect(page.getByRole("img", { name: "QR do ingresso" })).toBeVisible();
  await expect(page.getByTestId("ticket-credential")).toHaveText(ticket.qr_credential);
  await expect(page.getByRole("button", { name: /Compartilhar|Copiar link/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Ver ingresso" })).toHaveCount(0);

  const gateToken = await login(request, "gate@demo.elitetickets.local");
  const validationResponse = await request.post(`${apiUrl}/gate/events/${eventId}/validate`, {
    headers: {
      ...authorization(gateToken),
      "Idempotency-Key": crypto.randomUUID(),
    },
    data: { credential: ticket.qr_credential },
  });
  expect(validationResponse.ok()).toBeTruthy();
  expect((await validationResponse.json()).result).toBe("VALID");

  const expiredResponse = await page.reload();
  expect(expiredResponse?.headers()["cache-control"]).toContain("no-store");
  expect(expiredResponse?.headers()["referrer-policy"]).toBe("no-referrer");
  await expect(page.getByRole("heading", { name: "Ingresso compartilhado expirado" })).toBeVisible();
  await expect(page.getByRole("img", { name: "QR do ingresso" })).toHaveCount(0);
});

async function login(
  request: import("@playwright/test").APIRequestContext,
  email: string,
): Promise<string> {
  const response = await request.post(`${apiUrl}/auth/token`, {
    data: { email, password: "DemoElite2026!" },
  });
  expect(response.ok()).toBeTruthy();
  return ((await response.json()) as { access_token: string }).access_token;
}

function authorization(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}
