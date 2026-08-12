import { expect, test, type Page } from "@playwright/test";

const webUrl = process.env.E2E_WEB_URL ?? "http://127.0.0.1:3000";
const gateEvent = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Sessão da Portaria",
  starts_at: "2030-01-01T21:00:00Z",
  venue_name: "Cinema Central",
};

test.beforeEach(async ({ page }) => {
  await authenticateGate(page);
  await page.route("**/api/v1/gate/events", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([gateEvent]),
    });
  });
});

test("renders the redesigned gate shell and requires an event selection", async ({ page }) => {
  await page.goto(`${webUrl}/gate`);

  const gateShell = page.locator("article.ticket").filter({ hasText: "Validar ingresso" });
  await expect(gateShell).toBeVisible();
  await expect(gateShell.getByText("Portaria", { exact: true })).toBeVisible();
  await expect(gateShell.getByRole("heading", { name: "Validar ingresso" })).toBeVisible();

  const eventSelect = page.getByLabel("Evento publicado");
  await expect(eventSelect).toHaveValue("");
  await expect(eventSelect.locator("option")).toHaveCount(2);
  await expect(eventSelect.locator(`option[value="${gateEvent.id}"]`)).toContainText(
    `${gateEvent.title} —`,
  );

  const gateSections = page.locator(".gate-sections > article.ticket");
  const cameraTicket = gateSections.filter({ hasText: "Leitura por câmera" });
  const manualTicket = gateSections.filter({ hasText: "Entrada manual" });
  await expect(cameraTicket).toBeVisible();
  await expect(manualTicket).toBeVisible();
  await expect(cameraTicket.getByRole("button", { name: "Usar câmera" })).toBeDisabled();

  await page.getByLabel("Código do ingresso").fill("manual-code");
  await expect(manualTicket.getByRole("button", { name: "Validar código" })).toBeDisabled();

  await eventSelect.selectOption(gateEvent.id);
  await expect(cameraTicket.getByRole("button", { name: "Usar câmera" })).toBeEnabled();
  await expect(manualTicket.getByRole("button", { name: "Validar código" })).toBeEnabled();
});

test("camera and manual input feed the same online validation action", async ({ page }) => {
  const credentials: string[] = [];
  await installCamera(page, { credential: "camera-code" });
  await page.route("**/api/v1/gate/events/*/validate", async (route) => {
    credentials.push(route.request().postDataJSON().credential);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ result: "VALID", attempted_at: "2026-08-11T12:00:00Z" }),
    });
  });

  await openGate(page);
  await page.getByLabel("Código do ingresso").fill("manual-code");
  await page.getByRole("button", { name: "Validar código" }).click();
  await expect(page.getByRole("heading", { name: "Entrada autorizada" })).toBeVisible();

  await page.getByRole("button", { name: "Usar câmera" }).click();
  await expect.poll(() => credentials).toEqual(["manual-code", "camera-code"]);
  await expect(page.getByRole("heading", { name: "Entrada autorizada" })).toBeVisible();
});

test("denied camera permission keeps manual validation available", async ({ page }) => {
  await installCamera(page, { denied: true });
  await page.route("**/api/v1/gate/events/*/validate", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ result: "INVALID", attempted_at: "2026-08-11T12:00:00Z" }),
    });
  });

  await openGate(page);
  await page.getByRole("button", { name: "Usar câmera" }).click();
  await expect(page.getByText("Permissão de câmera negada", { exact: false })).toBeVisible();
  await page.getByLabel("Código do ingresso").fill("manual-fallback");
  await page.getByRole("button", { name: "Validar código" }).click();
  await expect(page.getByRole("heading", { name: "Entrada recusada" })).toBeVisible();
});

for (const scenario of [
  ["VALID", "Entrada autorizada"],
  ["INVALID", "Entrada recusada"],
  ["ALREADY_USED", "Entrada já registrada"],
  ["WRONG_EVENT", "Selecione o evento do ingresso"],
] as const) {
  test(`presents the ${scenario[0]} result without relying on color`, async ({ page }) => {
    await page.route("**/api/v1/gate/events/*/validate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ result: scenario[0], attempted_at: "2026-08-11T12:00:00Z" }),
      });
    });

    await openGate(page);
    await page.getByLabel("Código do ingresso").fill(`credential-${scenario[0]}`);
    await page.getByRole("button", { name: "Validar código" }).click();
    const result = page.locator(`[data-validation-result="${scenario[0]}"]`);
    await expect(result).toBeVisible();
    await expect(result).toHaveAttribute("role", "alert");
    await expect(result.getByRole("heading", { name: scenario[1] })).toBeVisible();
    await expect(result.getByText(`Tentativa:`, { exact: false })).toBeVisible();
  });
}

test("backend failure refuses offline admission and offers no eligibility result", async ({ page }) => {
  await page.route("**/api/v1/gate/events/*/validate", async (route) => route.abort("failed"));

  await openGate(page);
  await page.getByLabel("Código do ingresso").fill("offline-code");
  await page.getByRole("button", { name: "Validar código" }).click();

  const result = page.locator('[data-validation-result="BACKEND_UNAVAILABLE"]');
  await expect(result).toBeVisible();
  await expect(result.getByRole("heading", { name: "Entrada não autorizada" })).toBeVisible();
  await expect(result).toContainText("Não admita o ingresso offline");
  await expect(page.locator('[data-validation-result="VALID"]')).toHaveCount(0);
});

async function authenticateGate(page: Page) {
  await page.addInitScript(() => {
    window.sessionStorage.setItem(
      "elite-tickets.session",
      JSON.stringify({
        accessToken: "gate-e2e-token",
        expiresAt: Date.now() + 15 * 60 * 1000,
        role: "GATE",
      }),
    );
  });
}

async function openGate(page: Page) {
  await page.goto(`${webUrl}/gate`);
  await page.getByLabel("Evento publicado").selectOption(gateEvent.id);
}

async function installCamera(
  page: Page,
  options: { credential?: string; denied?: boolean },
) {
  await page.addInitScript((camera) => {
    class TestBarcodeDetector {
      private delivered = false;

      async detect() {
        if (this.delivered || !camera.credential) return [];
        this.delivered = true;
        return [{ rawValue: camera.credential }];
      }
    }

    Object.defineProperty(window, "BarcodeDetector", {
      configurable: true,
      value: TestBarcodeDetector,
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async () => {
          if (camera.denied) throw new DOMException("Denied", "NotAllowedError");
          return new MediaStream();
        },
      },
    });
    HTMLMediaElement.prototype.play = async () => undefined;
  }, options);
}
