import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CheckoutFlow } from "@/components/checkout/checkout-flow";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));

describe("checkout flow result semantics", () => {
  it("starts with a reservation action and no issued-ticket claim", () => {
    render(<CheckoutFlow eventId="event-1" quantity={2} />);
    expect(screen.getByRole("button", { name: "Criar reserva" })).toBeVisible();
    expect(screen.queryByText(/ingresso.*emitido/i)).not.toBeInTheDocument();
  });
});
