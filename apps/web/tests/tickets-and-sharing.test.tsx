import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import CustomerHomePage from "../app/customer/page";
import TicketDetailPage from "../app/customer/tickets/[ticketId]/page";
import SharedTicketPage from "../app/shared/tickets/[shareToken]/page";
import { mapShareSummary, mapTicketSummary } from "../lib/mappers";

describe("tickets and sharing", () => {
  it("renders the customer ticket hub with a clear tickets-oriented shell", () => {
    render(React.createElement(CustomerHomePage));

    expect(screen.getByRole("heading", { name: "Customer" })).toBeInTheDocument();
    expect(screen.getByText(/manage your tickets/i)).toBeInTheDocument();
  });

  it("renders the shared ticket page as a public read-only view", () => {
    render(React.createElement(SharedTicketPage));

    expect(
      screen.getByRole("heading", { name: "Shared ticket" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/public read-only ticket view/i)).toBeInTheDocument();
  });

  it("maps ticket summary fields used by ticket and QR rendering", () => {
    const ticket = mapTicketSummary({
      id: "ticket-1",
      event_id: "event-1",
      status: "ISSUED",
      qr_credential: "qr-credential-123",
    });

    expect(ticket).toEqual({
      id: "ticket-1",
      eventId: "event-1",
      status: "ISSUED",
      qrCredential: "qr-credential-123",
    });
  });

  it("keeps QR credentials available without inventing owner identity", () => {
    const ticket = mapTicketSummary({
      id: "ticket-2",
      event_id: "event-2",
      status: "ACTIVE",
      qr_credential: "secure-qr-credential",
    });

    expect(ticket.qrCredential).toBe("secure-qr-credential");
    expect(ticket).not.toHaveProperty("ownerName");
  });

  it("maps share URLs for the public shared ticket experience", () => {
    const share = mapShareSummary({
      share_url: "https://example.com/shared/tickets/share-1",
    });

    expect(share.shareUrl).toBe("https://example.com/shared/tickets/share-1");
  });

  it("keeps the shared ticket page read-only and free of private account data", () => {
    render(React.createElement(SharedTicketPage));

    expect(screen.queryByText(/owner/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/email/i)).not.toBeInTheDocument();
  });

  it("renders the ticket detail page with a secure QR presentation area", async () => {
    render(
      React.createElement(TicketDetailPage, {
        params: Promise.resolve({
          ticketId: "ticket-42",
        }),
      }),
    );

    expect(
      await screen.findByRole("heading", { name: /ticket detail/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/secure qr credential/i)).toBeInTheDocument();
    expect(screen.getByText(/verified ticket/i)).toBeInTheDocument();
  });
});
