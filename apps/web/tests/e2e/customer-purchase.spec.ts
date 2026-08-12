import { expect, test } from "@playwright/test";

const webUrl = process.env.E2E_WEB_URL ?? "http://127.0.0.1:3000";

test("CUSTOMER discovers, buys two tickets, and sees an immutable decline", async ({ page }) => {
  await page.goto(webUrl);
  await page.getByLabel("Filme ou local").fill("Clube da Luta");
  await page.getByRole("button", { name: "Pesquisar" }).click();
  const eventCard = page.locator("article.ticket").filter({ hasText: "Clube da Luta" });
  await expect(eventCard).toBeVisible();
  await expect(eventCard).toHaveClass(/event-card/);
  await eventCard.getByRole("link", { name: "Ver evento" }).click();
  await expect(page).toHaveURL(/\/events\/[0-9a-f-]+$/);
  const eventUrl = page.url();

  await page.goto(`${webUrl}/login`);
  await page.getByLabel("E-mail").fill("customer@demo.elitetickets.local");
  await page.getByLabel("Senha").fill("DemoElite2026!");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/customer\/tickets$/);
  await expect(page.getByText("Carregando ingressos…")).toHaveCount(0);
  const customerTickets = page.locator("article.customer-ticket");
  const initialTickets = await customerTickets.count();

  await page.goto(eventUrl);
  await expect(page.getByRole("heading", { name: /Clube da Luta/, level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Quantidade" })).toBeVisible();
  await page.getByRole("button", { name: "Aumentar quantidade" }).click();
  await page.getByRole("link", { name: "Reservar ingressos" }).click();
  await expect(page).toHaveURL(/\/customer\/checkout\/[0-9a-f-]+\?quantity=2$/);
  await expect(page.locator("article.ticket").filter({ hasText: "Checkout" })).toBeVisible();
  await expect(page.locator(".ledger__row").filter({ hasText: "Quantidade" })).toContainText("2");
  await page.getByRole("button", { name: "Criar reserva" }).click();
  await page.getByRole("button", { name: "Simular aprovação" }).click();
  await expect(page.getByRole("status", { name: "APPROVED" })).toBeVisible();
  await expect(page.getByText("2 ingresso(s) emitido(s).")).toBeVisible();
  await page.getByRole("link", { name: "Ver meus ingressos" }).click();
  await expect(page).toHaveURL(/\/customer\/tickets$/);
  await expect(customerTickets).toHaveCount(initialTickets + 2);

  await page.goto(eventUrl);
  const availabilityValue = page
    .locator(".ledger__row")
    .filter({ hasText: "Disponíveis" })
    .first()
    .locator(".ledger__value");
  const availabilityBeforeDecline = (await availabilityValue.textContent())?.trim();
  expect(availabilityBeforeDecline).toBeTruthy();
  await page.getByRole("link", { name: "Reservar ingressos" }).click();
  await page.getByRole("button", { name: "Criar reserva" }).click();
  await page.getByRole("button", { name: "Simular recusa" }).click();
  await expect(page.getByRole("status", { name: "DECLINED" })).toBeVisible();
  await expect(page.getByText("Pagamento recusado.", { exact: false })).toBeVisible();
  await expect(page.getByText("Nenhum ingresso foi emitido", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Simular aprovação" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Repetir tentativa idempotente" })).toHaveCount(0);
  await page.getByRole("link", { name: "Voltar ao evento" }).click();
  await expect(page).toHaveURL(/\/events\/[0-9a-f-]+$/);
  await expect(availabilityValue).toHaveText(availabilityBeforeDecline ?? "");

  await page.goto(`${webUrl}/customer/tickets`);
  await expect(customerTickets).toHaveCount(initialTickets + 2);
});
