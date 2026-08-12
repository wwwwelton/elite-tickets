import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  myTickets: vi.fn(() => <div>Ingressos do cliente</div>),
}));

vi.mock("@/components/tickets/my-tickets", () => ({
  MyTickets: mocks.myTickets,
}));

import TicketDetailPage from "@/app/customer/tickets/[ticketId]/page";

describe("TicketDetailPage", () => {
  it("surfaces a return path to the customer tickets list", async () => {
    const page = await TicketDetailPage({
      params: Promise.resolve({ ticketId: "ticket-1" }),
    });
    render(page);

    expect(screen.getByRole("link", { name: "Voltar aos meus ingressos" })).toHaveAttribute(
      "href",
      "/customer/tickets",
    );
    expect(mocks.myTickets).toHaveBeenCalledWith({ ticketId: "ticket-1" }, undefined);
  });
});
