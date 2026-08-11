import { expect, test, type Page } from "@playwright/test";

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
  await expect(cta).toHaveCSS("background-color", "rgb(230, 25, 25)");
  await expect(cta).toHaveCSS("color", "rgb(255, 255, 255)");
  expect(contrastRatio("#ffffff", "#e61919")).toBeGreaterThanOrEqual(4.5);

  const ticket = page.locator("article.ticket").first();
  await expect(ticket).toBeVisible();
  await expect(ticket).toHaveCSS("border-radius", "0px");
  await expect(ticket).toHaveCSS("box-shadow", "none");
  await expect(ticket.locator(".perforation").first()).toHaveCSS("border-top-style", "dashed");
  const status = ticket.locator("[data-status]").first();
  await expect(status).toContainText(/AVAILABLE|SOLD_OUT/);
  await expect(status.locator('[aria-hidden="true"]')).not.toHaveText("");

  await page.emulateMedia({ reducedMotion: "reduce" });
  const reducedDurations = await ticket.evaluate((element) => {
    const style = getComputedStyle(element);
    return [Number.parseFloat(style.animationDuration), Number.parseFloat(style.transitionDuration)];
  });
  expect(reducedDurations.every((duration) => duration <= 0.00001)).toBeTruthy();

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await grid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length)).toBe(4);
  await expect(heading).toHaveCSS("font-size", "48px");
});

test("gate announces camera fallback and non-color validation status", async ({ page }) => {
  await prepareGate(page);
  await page.route("**/api/v1/gate/events/*/validate", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ result: "WRONG_EVENT", attempted_at: "2026-08-11T12:00:00Z" }),
    });
  });

  await page.goto(`${webUrl}/gate`);
  await page.getByLabel("Evento publicado").selectOption("event-accessibility");
  await page.getByRole("button", { name: "Usar câmera" }).click();
  await expect(page.getByRole("status").filter({ hasText: "entrada manual" })).toBeVisible();

  await page.getByLabel("Código do ingresso").fill("manual-accessibility-code");
  await page.getByRole("button", { name: "Validar código" }).click();
  const result = page.locator('[data-validation-result="WRONG_EVENT"]');
  await expect(result).toHaveAttribute("role", "alert");
  await expect(result).toContainText("Evento incorreto");
  await expect(result).toContainText("↔");
});

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
