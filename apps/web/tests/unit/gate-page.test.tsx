import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  scanner: vi.fn(() => <div>Painel da portaria</div>),
}));

vi.mock("@/components/tickets/scanner", () => ({
  Scanner: mocks.scanner,
}));

import GatePage from "@/app/gate/page";

describe("GatePage", () => {
  it("surfaces a return path to the public event experience", () => {
    render(<GatePage />);

    expect(screen.getByRole("link", { name: "Voltar aos eventos públicos" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(mocks.scanner).toHaveBeenCalledWith({}, undefined);
  });
});
