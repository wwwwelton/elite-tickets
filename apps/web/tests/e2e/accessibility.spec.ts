import { expect, test, type Locator, type Page } from "@playwright/test";

const webUrl = process.env.E2E_WEB_URL ?? "http://127.0.0.1:3000";

test("public UI follows the responsive high-contrast keyboard design system", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(webUrl);

  const body = page.locator("body");
  await expect(body).toHaveCSS("background-color", "rgb(0, 0, 0)");
  await expect(body).toHaveCSS("color", "rgb(255, 255, 255)");
  expect(contrastRatio("#ffffff", "#000000")).toBeGreaterThanOrEqual(4.5);

  const grid = page.locator(".page-grid").first();
  expect(await grid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length)).toBe(12);

  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toHaveCSS("font-family", /Bodoni Moda/);
  await expect(heading).toHaveCSS("font-size", "72px");
  await expect(page.locator(".code-data").first()).toHaveCSS("font-family", /JetBrains Mono/);

  const search = page.getByLabel("Filme ou local");
  const cta = page.getByRole("button", { name: "Pesquisar" });
  await page.locator("body").press("Tab");
  await expect(search).toBeFocused();
  await expect(search).toHaveCSS("border-bottom-color", "rgb(230, 25, 25)");
  await expect(search).toHaveCSS("border-bottom-width", "2px");
  await page.keyboard.press("Tab");
  await expect(cta).toBeFocused();
  await expect(cta).toHaveCSS("outline-color", "rgb(230, 25, 25)");
  await expect(page.locator("main").first()).toBeVisible();
  await expect(cta).toHaveCSS("background-color", "rgb(230, 25, 25)");
  await expect(cta).toHaveCSS("color", "rgb(255, 255, 255)");
  expect(contrastRatio("#ffffff", "#e61919")).toBeGreaterThanOrEqual(4.5);

  const ticket = page.locator(".event-list article.ticket").first();
  await expect(ticket).toBeVisible();
  await expect(ticket).toHaveCSS("border-radius", "0px");
  await expect(ticket).toHaveCSS("box-shadow", "none");
  await expect(ticket.locator(".perforation").first()).toHaveCSS("border-top-style", "dashed");
  const status = ticket.getByRole("status", { name: /AVAILABLE|SOLD_OUT/ });
  await expect(status).toContainText(/AVAILABLE|SOLD_OUT/);
  await expect(status.locator('[aria-hidden="true"]')).not.toHaveText("");
  await expect(page.getByRole("link", { name: "Ver evento" }).first()).toHaveCSS(
    "min-height",
    "44px",
  );

  await page.setViewportSize({ width: 1024, height: 900 });
  await expect(page.getByRole("button", { name: "Abrir menu" })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible();

  await page.setViewportSize({ width: 768, height: 900 });
  await expect(page.getByRole("button", { name: "Abrir menu" })).toBeVisible();
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible();

  await page.emulateMedia({ reducedMotion: "reduce" });
  const reducedDurations = await ticket.evaluate((element) => {
    const style = getComputedStyle(element);
    return [Number.parseFloat(style.animationDuration), Number.parseFloat(style.transitionDuration)];
  });
  expect(reducedDurations.every((duration) => duration <= 0.00001)).toBeTruthy();

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await grid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length)).toBe(4);
  const mobileHeadingBox = await heading.boundingBox();
  expect(mobileHeadingBox?.width ?? 0).toBeLessThanOrEqual(350);
  const mobileActionBox = await page.getByRole("link", { name: "Ver evento" }).first().boundingBox();
  expect(mobileActionBox?.width ?? 0).toBeGreaterThanOrEqual(44);
  await expectNoHorizontalOverflow(page);
});

test("customer ticket exposes named regions and moves focus to the generated share link", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await prepareCustomerTicket(page);
  await page.goto(`${webUrl}/customer/tickets/ticket-accessibility`);

  const ticket = page.getByRole("article", { name: "Sessão acessível do cliente" });
  await expect(ticket).toBeVisible();
  await expect(ticket).not.toHaveAttribute("aria-busy", "true");
  await expect(ticket.getByRole("region", { name: "Dados do ingresso" })).toBeVisible();
  await expect(
    ticket.getByRole("img", { name: "QR do ingresso para validação na portaria" }),
  ).toBeVisible();
  await expect(ticket.getByRole("region", { name: "Código para entrada manual" })).toBeVisible();

  const status = ticket.getByRole("status", { name: "Ativo" });
  await expect(status).toHaveAttribute("data-status", "ACTIVE");
  await expect(status.locator('[aria-hidden="true"]')).toHaveText("✓");

  const share = ticket.getByRole("region", { name: "Compartilhamento do ingresso" });
  const shareButton = share.getByRole("button", { name: "Compartilhar ingresso" });
  await expect(shareButton).toHaveAttribute("aria-expanded", "false");
  await shareButton.focus();
  await expect(shareButton).toBeFocused();
  await expect(shareButton).toHaveCSS("outline-color", "rgb(230, 25, 25)");
  await shareButton.click();

  const shareInput = share.getByLabel("Link público somente leitura");
  await expect(shareInput).toBeFocused();
  await expect(shareInput).toHaveAttribute("readonly", "");
  const recoverButton = share.getByRole("button", { name: "Recuperar link" });
  await expect(recoverButton).toHaveAttribute("aria-expanded", "true");
  await expect(recoverButton).toHaveAttribute("aria-controls", /.+/);
  await expect(share.getByRole("status")).toContainText(
    "O ingresso continua pertencendo a você",
  );
  await expect(shareInput).toHaveAttribute("aria-describedby", /.+/);
  await expect(page.getByRole("link", { name: "Voltar aos eventos" })).toHaveAttribute("href", "/");

  await page.setViewportSize({ width: 390, height: 844 });
  const qrBox = await ticket
    .getByRole("img", { name: "QR do ingresso para validação na portaria" })
    .boundingBox();
  expect(qrBox?.width ?? 0).toBeLessThanOrEqual(280);
  await expectNoHorizontalOverflow(page);
});

test("organizer form keeps keyboard focus and switches from two columns to one", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await prepareOrganizer(page);
  await page.goto(`${webUrl}/organizer/events/new`);

  const search = page.getByLabel("Pesquisar evento Ticketmaster");
  const searchButton = page.getByRole("button", { name: "Pesquisar no catálogo" });
  await expect(searchButton).toBeDisabled();
  await search.focus();
  await expect(search).toBeFocused();
  await expect(search).toHaveCSS("border-bottom-color", "rgb(230, 25, 25)");
  await search.fill("Concerto acessível");
  await expect(searchButton).toBeEnabled();
  await searchButton.click();
  await page.getByRole("button", { name: "Selecionar evento" }).click();

  const form = page.locator(".organizer-selector__form");
  await expect(form).toBeVisible();
  expect(await gridColumnCount(form)).toBe(2);
  const resultCard = page.locator(".organizer-selector__results > article.ticket").first();
  await expect(resultCard).toHaveCSS("grid-column-start", "span 6");
  await expectNoHorizontalOverflow(page);

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await gridColumnCount(form)).toBe(1);
  await expect(resultCard).toHaveCSS("grid-column-start", "span 4");
  await expect(page.getByRole("button", { name: "Criar rascunho" })).toHaveCSS("min-height", "44px");
  await expectNoHorizontalOverflow(page);
});

test("gate announces camera fallback and non-color validation status", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await prepareGate(page);
  await page.route("**/api/v1/gate/events/*/validate", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ result: "WRONG_EVENT", attempted_at: "2026-08-11T12:00:00Z" }),
    });
  });

  await page.goto(`${webUrl}/gate`);
  const eventSelect = page.getByLabel("Evento publicado");
  await expect(eventSelect).toHaveAttribute("aria-describedby", "gate-event-help");
  await expect(page.locator("#gate-event-help")).toContainText("Escolha o evento");
  const gateSections = page.locator(".gate-sections");
  expect(await gridColumnCount(gateSections)).toBe(2);
  const camera = page.getByRole("article", { name: "Leitura de ingresso por câmera" });
  const manual = page.getByRole("article", { name: "Validação por entrada manual" });
  await expect(camera.getByRole("region", { name: "Controles da câmera" })).toBeVisible();
  await expect(manual.getByRole("region", { name: "Código e ação de validação" })).toBeVisible();

  await eventSelect.selectOption("event-accessibility");
  await camera.getByRole("button", { name: "Usar câmera" }).click();
  await expect(page.getByRole("status").filter({ hasText: "entrada manual" })).toBeVisible();

  await manual.getByLabel("Código do ingresso").fill("manual-accessibility-code");
  await manual.getByRole("button", { name: "Validar código" }).click();
  const result = page.locator('[data-validation-result="WRONG_EVENT"]');
  await expect(result).toHaveAttribute("role", "alert");
  await expect(result).toHaveAttribute("aria-atomic", "true");
  await expect(result).toBeFocused();
  await expect(result).toContainText("Evento incorreto");
  await expect(result.getByRole("heading", { name: "Selecione o evento do ingresso" })).toBeVisible();
  await expect(result).toContainText("↔");

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await gridColumnCount(gateSections)).toBe(1);
  await expectNoHorizontalOverflow(page);
});

async function prepareCustomerTicket(page: Page) {
  const shareUrl = `${webUrl}/shared/tickets/accessibility-token`;
  await page.addInitScript(() => {
    window.sessionStorage.setItem(
      "elite-tickets.session",
      JSON.stringify({
        accessToken: "customer-accessibility-token",
        expiresAt: Date.now() + 15 * 60 * 1000,
        role: "CUSTOMER",
      }),
    );
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => undefined },
    });
  });
  await page.route("**/api/v1/me/tickets", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "ticket-accessibility",
          event_id: "event-customer-accessibility",
          owner_name: "Cliente Acessível",
          status: "ACTIVE",
          issued_at: "2026-08-11T12:00:00Z",
          used_at: null,
          qr_credential: "signed.accessibility.credential",
        },
      ]),
    });
  });
  await page.route("**/api/v1/events/event-customer-accessibility", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        title: "Sessão acessível do cliente",
        starts_at: "2030-01-01T20:00:00Z",
        venue_name: "Sala acessível",
      }),
    });
  });
  await page.route("**/api/v1/me/tickets/ticket-accessibility/share", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ share_url: shareUrl }),
    });
  });
}

async function prepareOrganizer(page: Page) {
  await page.addInitScript(() => {
    window.sessionStorage.setItem(
      "elite-tickets.session",
      JSON.stringify({
        accessToken: "organizer-accessibility-token",
        expiresAt: Date.now() + 15 * 60 * 1000,
        role: "ORGANIZER",
      }),
    );
  });
  await page.route("**/api/v1/catalog/events**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [
          {
            external_id: "accessibility-event",
            title: "Concerto acessível",
            description: null,
            image_url: null,
            category: "Música",
            date: null,
            venue_name: null,
            city: "São Paulo",
            country_code: "BR",
          },
        ],
        page: 0,
        size: 20,
        total: 1,
        has_more: false,
      }),
    });
  });
}

async function prepareGate(page: Page) {
  await page.addInitScript(() => {
    window.sessionStorage.setItem(
      "elite-tickets.session",
      JSON.stringify({
        accessToken: "gate-accessibility-token",
        expiresAt: Date.now() + 15 * 60 * 1000,
        role: "GATE",
      }),
    );
    Object.defineProperty(window, "BarcodeDetector", { configurable: true, value: undefined });
  });
  await page.route("**/api/v1/gate/events", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "event-accessibility",
          title: "Sessão acessível",
          starts_at: "2030-01-01T20:00:00Z",
          venue_name: "Sala 1",
        },
      ]),
    });
  });
}

function contrastRatio(foreground: string, background: string): number {
  const luminance = (hex: string) => {
    const channels = hex
      .slice(1)
      .match(/.{2}/g)
      ?.map((channel) => Number.parseInt(channel, 16) / 255);
    if (!channels || channels.length !== 3) throw new Error("Invalid color");
    const [red = 0, green = 0, blue = 0] = channels.map((channel) =>
      channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

async function gridColumnCount(locator: Locator): Promise<number> {
  return locator.evaluate((element) =>
    getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length,
  );
}

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
}
