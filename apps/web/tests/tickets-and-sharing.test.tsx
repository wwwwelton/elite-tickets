import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import CustomerHomePage from "../app/customer/page";
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

  it("maps share URLs for the public shared ticket experience", () => {
    const share = mapShareSummary({
      share_url: "https://example.com/shared/tickets/share-1",
    });

    expect(share.shareUrl).toBe("https://example.com/shared/tickets/share-1");
  });
});
