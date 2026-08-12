import { expect, test } from "@playwright/test";

const webUrl = process.env.E2E_WEB_URL ?? "http://127.0.0.1:3000";

test("ORGANIZER retries Ticketmaster, creates a draft, and publishes it", async ({ page }) => {
  let catalogAttempts = 0;
  let events: Array<Record<string, unknown>> = [];

  await page.route("**/api/v1/auth/token", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "organizer-test-token",
        token_type: "bearer",
        expires_in: 900,
        role: "ORGANIZER",
      }),
    });
  });
  await page.route("**/api/v1/catalog/events**", async (route) => {
    const requestUrl = new URL(route.request().url());
    expect(requestUrl.searchParams.get("keyword")).toBe("Filme");
    expect(requestUrl.searchParams.get("countryCode")).toBe("BR");
    expect(route.request().headers().authorization).toBe("Bearer organizer-test-token");
    catalogAttempts += 1;
    if (catalogAttempts === 1) {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: { code: "dependency_unavailable", message: "Catálogo indisponível" },
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [
          {
            external_id: "42",
            title: "Filme de Teste",
            description: null,
            image_url: null,
            category: "Cinema",
            date: "2026-01-02",
            venue_name: "Cinema Central",
            city: "São Paulo",
            country_code: "BR",
            source: "ticketmaster",
          },
        ],
        page: 1,
        size: 1,
        total: 1,
        has_more: false,
      }),
    });
  });
  await page.route("**/api/v1/organizer/events", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(events) });
  });
  await page.route("**/api/v1/events", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    const payload = route.request().postDataJSON();
    expect(payload).toMatchObject({
      tmdb_id: 42,
      venue_name: "Cinema Central",
      capacity: 50,
      price: "25.00",
    });
    events = [eventResponse("DRAFT")];
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(events[0]) });
  });
  await page.route("**/api/v1/events/event-42/publish", async (route) => {
    events = [eventResponse("PUBLISHED")];
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(events[0]) });
  });

  await page.goto(`${webUrl}/login`);
  await page.getByLabel("E-mail").fill("organizer@example.com");
  await page.getByLabel("Senha").fill("Organizer123!");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/organizer\/events$/);
  await expect(page.getByRole("heading", { name: "Meus eventos" })).toBeVisible();
  await expect(page.getByText("Acompanhe publicação e estoque", { exact: false })).toBeVisible();
  await page.getByRole("link", { name: "Criar evento" }).click();
  await expect(page.getByRole("heading", { name: "Criar evento" })).toBeVisible();

  await page.getByLabel("Pesquisar evento Ticketmaster").fill("Filme");
  await page.getByRole("button", { name: "Pesquisar no catálogo" }).click();
  const catalogError = page.locator("article.ticket").filter({ hasText: "Catálogo indisponível" });
  await expect(catalogError.getByRole("status", { name: "WRONG_EVENT" })).toBeVisible();
  await expect(catalogError.getByRole("alert")).toHaveText("Catálogo indisponível");
  await catalogError.getByRole("button", { name: "Tentar novamente" }).click();

  const catalogResult = page
    .locator(".organizer-selector__results > article.ticket")
    .filter({ hasText: "Filme de Teste" });
  await expect(
    catalogResult.getByRole("img", {
      name: "Pôster indisponível para Pôster de Filme de Teste",
    }),
  ).toBeVisible();
  await expect(catalogResult).toContainText("Cinema");
  await expect(catalogResult).toContainText("Cinema Central");
  await expect(catalogResult).toContainText("São Paulo");
  await expect(catalogResult).toContainText("BR");
  await catalogResult.getByRole("button", { name: "Selecionar evento" }).click();
  await expect(page.getByText("Origem selecionada", { exact: true })).toBeVisible();

  await page.getByLabel("Local").fill("Cinema Central");
  await page.getByLabel("Endereço").fill("Avenida Central, 10");
  await page.getByLabel("Início").fill("2030-01-01T18:00");
  await page.getByLabel("Término").fill("2030-01-01T20:00");
  await page.getByLabel("Capacidade").fill("50");
  await page.getByLabel("Preço (BRL)").fill("25.00");
  await page.getByRole("button", { name: "Criar rascunho" }).click();

  await expect(page).toHaveURL(/\/organizer\/events$/);
  const ledger = page.locator("article.organizer-event-card").filter({ hasText: "Filme de Teste" });
  await expect(ledger.getByRole("status", { name: "DRAFT" })).toBeVisible();
  await expect(ledger.getByRole("region", { name: "Estoque de Filme de Teste" })).toContainText(
    "50",
  );
  await ledger.getByRole("button", { name: "Publicar" }).click();
  await expect(ledger.getByRole("status", { name: "PUBLISHED" })).toBeVisible();
  expect(catalogAttempts).toBe(2);
});

function eventResponse(state: "DRAFT" | "PUBLISHED") {
  return {
    id: "event-42",
    state,
    title: "Filme de Teste",
    poster_url: null,
    starts_at: "2030-01-01T21:00:00Z",
    ends_at: "2030-01-01T23:00:00Z",
    timezone: "America/Sao_Paulo",
    venue_name: "Cinema Central",
    venue_address: "Avenida Central, 10",
    capacity: 50,
    reserved_quantity: 0,
    sold_quantity: 0,
    available_quantity: 50,
    price: "25.00",
  };
}
