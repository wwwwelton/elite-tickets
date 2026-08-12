import { render, screen } from "@testing-library/react";
import { fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { clearSession, saveSession } from "@/lib/auth";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  apiMutation: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }) }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, apiMutation: mocks.apiMutation };
});

describe("checkout flow result semantics", () => {
  beforeEach(() => {
    clearSession();
    saveSession({
      access_token: "customer-token",
      token_type: "bearer",
      expires_in: 900,
      role: "CUSTOMER",
    });
    mocks.replace.mockReset();
    mocks.apiMutation.mockReset();
  });

  it("starts with a reservation action and no issued-ticket claim", () => {
    render(<CheckoutFlow eventId="event-1" quantity={2} />);
    expect(screen.getByRole("button", { name: "Criar reserva" })).toBeVisible();
    expect(screen.queryByText(/ingresso.*emitido/i)).not.toBeInTheDocument();
  });

  it("surfaces customer navigation after an approved payment", async () => {
    mocks.apiMutation
      .mockResolvedValueOnce({
        id: "reservation-1",
        event_id: "event-1",
        status: "PENDING",
        quantity: 2,
        total_amount: "50.00",
        expires_at: "2030-01-01T20:00:00Z",
      })
      .mockResolvedValueOnce({
        reservation: {
          id: "reservation-1",
          event_id: "event-1",
          status: "APPROVED",
          quantity: 2,
          total_amount: "50.00",
          expires_at: "2030-01-01T20:00:00Z",
        },
        decision: "APPROVED",
        tickets: [{ id: "ticket-1" }, { id: "ticket-2" }],
      });

    render(<CheckoutFlow eventId="event-1" quantity={2} />);
    fireEvent.click(screen.getByRole("button", { name: "Criar reserva" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Simular aprovação" })).toBeVisible());
    fireEvent.click(screen.getByRole("button", { name: "Simular aprovação" }));

    expect(await screen.findByRole("status", { name: "APPROVED" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Ver meus ingressos" })).toHaveAttribute(
      "href",
      "/customer/tickets",
    );
    expect(screen.getByRole("link", { name: "Voltar ao evento" })).toHaveAttribute(
      "href",
      "/events/event-1",
    );
  });
});
