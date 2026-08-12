import { expect, test } from "@playwright/test";

const webUrl = process.env.E2E_WEB_URL ?? "http://127.0.0.1:3000";

test("CUSTOMER discovers, buys two tickets, and sees an immutable decline", async ({ page }) => {
  await page.goto(webUrl);
  await page.getByLabel("Filme ou local").fill("Clube da Luta");
  await page.getByRole("button", { name: "Pesquisar" }).click();
  const eventCard = page.locator("article.ticket").filter({ hasText: "Clube da Luta" });
  await expect(eventCard).toBeVisible();
  await eventCard.getByRole("link", { name: "Ver evento" }).click();
  await expect(page).toHaveURL(/\/events\/[0-9a-f-]+$/);
  const eventUrl = page.url();

  await page.goto(`${webUrl}/login`);
  await page.getByLabel("E-mail").fill("customer@demo.elitetickets.local");
  await page.getByLabel("Senha").fill("DemoElite2026!");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/customer\/tickets$/);
  const initialTickets = await page.locator("article.ticket").count();

  await page.goto(eventUrl);
  await page.getByRole("heading", { name: "Confirmar reserva" }).toBeVisible();
  await page.getByRole("button", { name: "Aumentar quantidade" }).click();
  await page.getByRole("link", { name: "Reservar ingressos" }).click();
  await expect(page.locator("article.ticket").filter({ hasText: "Checkout" })).toBeVisible();
  await expect(page.getByText("Quantidade").locator("..")).toContainText("2");
  await page.getByRole("button", { name: "Criar reserva" }).click();
  await page.getByRole("button", { name: "Simular aprovação" }).click();
  await expect(page.getByText("2 ingresso(s) emitido(s).")).toBeVisible();
  await page.getByRole("link", { name: "Ver meus ingressos" }).click();
  await expect(page.locator("article.ticket")).toHaveCount(initialTickets + 2);

  await page.goto(eventUrl);
  const availabilityRow = page.locator(".ledger__row").filter({ hasText: "Disponíveis" }).first();
  const availabilityBeforeDecline = await availabilityRow.textContent();
  await page.getByRole("link", { name: "Reservar ingressos" }).click();
  await page.getByRole("button", { name: "Criar reserva" }).click();
  await page.getByRole("button", { name: "Simular recusa" }).click();
  await expect(page.getByText("Pagamento recusado.", { exact: false })).toBeVisible();
  await expect(page.getByText("Nenhum ingresso foi emitido", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Simular aprovação" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Repetir tentativa idempotente" })).toHaveCount(0);
  await page.getByRole("link", { name: "Voltar ao evento" }).click();
  await expect(availabilityRow).toHaveText(availabilityBeforeDecline ?? "");

  await page.goto(`${webUrl}/customer/tickets`);
  await expect(page.locator("article.ticket")).toHaveCount(initialTickets + 2);
});
