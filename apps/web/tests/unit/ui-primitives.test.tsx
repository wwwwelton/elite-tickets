import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LedgerRow, Perforation, StateMessage, Status, Ticket } from "@/components/ui";

describe("shared UI primitives", () => {
  it("renders a ticket shell with semantic sections", () => {
    render(
      <Ticket
        header={<h1>Ingresso</h1>}
        details={
          <ul>
            <LedgerRow label="Data" value="12/08/2026" />
          </ul>
        }
        footer={<button type="button">Ação</button>}
      />,
    );

    expect(screen.getByRole("article")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Ingresso" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Ação" })).toBeVisible();
  });

  it("renders the perforation as presentation only", () => {
    render(<Perforation />);
    const perforation = screen.getByTestId("perforation");
    expect(perforation).toHaveAttribute("aria-hidden", "true");
  });

  it("renders ledger rows with a technical value style", () => {
    render(<LedgerRow label="Preço" value="R$ 25,00" />);
    expect(screen.getByText("Preço")).toHaveClass("ledger__label");
    expect(screen.getByText("R$ 25,00")).toHaveClass("ledger__value");
  });

  it("renders explicit status semantics", () => {
    render(<Status status="ALREADY_USED" label="Já usado" />);
    expect(screen.getByText("Já usado")).toHaveAttribute("aria-label", "Já usado");
    expect(screen.getByText("Já usado")).toHaveAttribute("data-status", "ALREADY_USED");
  });

  it("renders reusable state messaging with an explicit tone", () => {
    render(<StateMessage tone="error">Falha de rede</StateMessage>);
    expect(screen.getByText("Falha de rede")).toHaveClass("state-message", "state-message--error");
  });
});
