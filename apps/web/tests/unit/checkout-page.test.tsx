import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkoutFlow: vi.fn(() => <div>Checkout flow</div>),
}));

vi.mock("@/components/checkout/checkout-flow", () => ({
  CheckoutFlow: mocks.checkoutFlow,
}));

import CheckoutPage from "@/app/customer/checkout/[eventId]/page";

describe("CheckoutPage", () => {
  beforeEach(() => {
    mocks.checkoutFlow.mockClear();
  });

  it("surfaces navigation back to the event and tickets", async () => {
    const page = await CheckoutPage({
      params: Promise.resolve({ eventId: "event-1" }),
      searchParams: Promise.resolve({ quantity: "2" }),
    });
    render(page);

    expect(screen.getByRole("link", { name: "Voltar ao evento" })).toHaveAttribute(
      "href",
      "/events/event-1",
    );
    expect(screen.getByRole("link", { name: "Meus ingressos" })).toHaveAttribute(
      "href",
      "/customer/tickets",
    );
    expect(mocks.checkoutFlow).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: "event-1", quantity: 2 }),
      undefined,
    );
  });
});
