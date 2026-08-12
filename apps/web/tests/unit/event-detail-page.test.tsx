import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  quantityControl: vi.fn(() => <div>Quantidade</div>),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, apiRequest: mocks.apiRequest };
});

vi.mock("@/components/events/quantity-control", () => ({
  QuantityControl: mocks.quantityControl,
}));

import EventDetailPage from "@/app/(public)/events/[eventId]/page";

describe("EventDetailPage", () => {
  beforeEach(() => {
    mocks.apiRequest.mockReset();
    mocks.quantityControl.mockClear();
  });

  it("surfaces navigation back to home and tickets", async () => {
    mocks.apiRequest.mockResolvedValue({
      id: "event-1",
      title: "Sessão Elite",
      poster_url: null,
      starts_at: "2030-06-01T22:00:00Z",
      ends_at: "2030-06-02T00:00:00Z",
      venue_name: "Cinema Central",
      capacity: 10,
      available_quantity: 5,
      price: "25.50",
    });

    const page = await EventDetailPage({
      params: Promise.resolve({ eventId: "event-1" }),
    });
    render(page);

    expect(screen.getByRole("link", { name: "Voltar ao início" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Meus ingressos" })).toHaveAttribute(
      "href",
      "/customer/tickets",
    );
    expect(mocks.quantityControl).toHaveBeenCalledWith(
      expect.objectContaining({ available: 5, eventId: "event-1" }),
      undefined,
    );
  });
});
