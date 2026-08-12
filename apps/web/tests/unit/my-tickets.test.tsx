import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, apiRequest: mocks.apiRequest };
});

import { MyTickets } from "@/components/tickets/my-tickets";
import { clearSession, saveSession } from "@/lib/auth";

describe("MyTickets", () => {
  beforeEach(() => {
    clearSession();
    mocks.apiRequest.mockReset();
  });

  it("shows customer session navigation and the issued ticket list", async () => {
    saveSession({
      access_token: "customer-token",
      token_type: "bearer",
      expires_in: 900,
      role: "CUSTOMER",
    });
    mocks.apiRequest.mockResolvedValueOnce([
      {
        id: "ticket-1",
        event_id: "event-1",
        owner_name: "Cliente Elite",
        status: "ACTIVE",
        issued_at: "2030-06-01T22:00:00Z",
        used_at: null,
        qr_credential: "credential-1",
      },
    ]);
    mocks.apiRequest.mockResolvedValueOnce({
      title: "Sessão Elite",
      starts_at: "2030-06-01T22:00:00Z",
      venue_name: "Cinema Central",
    });

    render(<MyTickets />);

    expect(await screen.findByRole("link", { name: "Explorar eventos" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Recarregar ingressos" })).toHaveAttribute(
      "href",
      "/customer/tickets",
    );
    expect(screen.getByText("Ingresso digital")).toBeVisible();
    expect(screen.getByRole("link", { name: "Ver ingresso" })).toHaveAttribute(
      "href",
      "/customer/tickets/ticket-1",
    );
  });
});
