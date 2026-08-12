import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test/api/v1");

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

import SharedTicketPage from "@/app/shared/tickets/[shareToken]/page";

describe("SharedTicketPage", () => {
  it("renders the read-only boundary and a public return path", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: "ticket-1",
          event_id: "event-1",
          owner_name: "Cliente",
          status: "ACTIVE",
          issued_at: "2026-08-11T12:00:00Z",
          used_at: null,
          qr_credential: "credential-1",
          event_title: "Sessão Elite",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const page = await SharedTicketPage({
      params: Promise.resolve({ shareToken: "share-token-1" }),
    });
    render(page);

    expect(screen.getByText("Visualização pública somente leitura. A propriedade não foi transferida.")).toBeVisible();
    expect(screen.getByRole("link", { name: "Voltar aos eventos" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("button", { name: "Compartilhar ingresso" })).not.toBeInTheDocument();
  });
});
