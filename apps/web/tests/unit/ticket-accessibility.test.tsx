import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EventPoster } from "@/components/events/poster";
import { CustomerTicketView } from "@/components/tickets/ticket";
import { ValidationResult } from "@/components/tickets/validation-result";
import { Status } from "@/components/ui/status";

const { toCanvas } = vi.hoisted(() => ({
  toCanvas: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("qrcode", () => ({ default: { toCanvas } }));

describe("ticket visual fallbacks and accessibility", () => {
  beforeEach(() => {
    toCanvas.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ title: "Sessão", starts_at: "2030-01-01T20:00:00Z", venue_name: "Sala 1" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test/api/v1");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("provides a named poster fallback", () => {
    render(<EventPoster alt="Filme teste" src={null} />);
    expect(screen.getByRole("img", { name: "Pôster indisponível para Filme teste" })).toBeVisible();
  });

  it("renders status text and a symbol so meaning is not color-only", () => {
    render(<Status status="WRONG_EVENT" />);
    const status = screen.getByText("WRONG_EVENT");
    expect(status).toHaveAttribute("data-status", "WRONG_EVENT");
    expect(status).toHaveTextContent("×");
  });

  it("announces backend unavailability as non-admission", () => {
    render(<ValidationResult result="BACKEND_UNAVAILABLE" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Entrada não autorizada");
    expect(screen.getByRole("alert")).toHaveTextContent("Não admita o ingresso offline");
  });

  it("uses exactly the displayed text credential to render the QR", async () => {
    const credential = "signed.header.credential";
    render(
      <CustomerTicketView
        allowShare={false}
        ticket={{
          id: "ticket-1",
          event_id: "event-1",
          owner_name: "Cliente",
          status: "ACTIVE",
          issued_at: "2026-08-11T12:00:00Z",
          used_at: null,
          qr_credential: credential,
        }}
      />,
    );

    expect(screen.getByTestId("ticket-credential")).toHaveTextContent(credential);
    await waitFor(() => expect(toCanvas).toHaveBeenCalled());
    expect(toCanvas.mock.calls[0]?.[1]).toBe(credential);
    expect(
      screen.getByRole("img", { name: "QR do ingresso para validação na portaria" }),
    ).toBeVisible();
    expect(screen.getByRole("region", { name: "Código para entrada manual" })).toBeVisible();
    expect(screen.getByText("Ativo")).toHaveAttribute("data-status", "ACTIVE");
    await waitFor(() => {
      expect(screen.getByRole("article", { name: "Sessão" })).toBeVisible();
    });
    expect(screen.getByRole("article", { name: "Sessão" })).toHaveClass("ticket-detail-card");
  });

  it("removes entry and sharing actions from a cancelled ticket", async () => {
    render(
      <CustomerTicketView
        ticket={{
          id: "ticket-cancelled",
          event_id: "event-1",
          owner_name: "Cliente",
          status: "CANCELLED",
          issued_at: "2026-08-11T12:00:00Z",
          used_at: null,
          qr_credential: "cancelled.credential",
        }}
      />,
    );

    expect(screen.getByText("Cancelado")).toHaveAttribute("data-status", "CANCELLED");
    expect(screen.getByText(/QR indisponível para entrada/)).toHaveAttribute("role", "status");
    expect(
      screen.queryByRole("img", { name: "QR do ingresso para validação na portaria" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Compartilhar ingresso" })).not.toBeInTheDocument();
    expect(toCanvas).not.toHaveBeenCalled();
  });
});
