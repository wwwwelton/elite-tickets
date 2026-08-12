import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { metadata } from "@/app/layout";
import { Button } from "@/components/ui/button";
import { Status } from "@/components/ui/status";

describe("design tokens and shell metadata", () => {
  it("declares the editorial shell metadata", () => {
    expect(metadata.title).toMatchObject({
      default: "EliteTickets",
      template: "%s · EliteTickets",
    });
    expect(metadata.description).toContain("ingressos digitais");
    expect(metadata.applicationName).toBe("EliteTickets");
    expect(metadata.themeColor).toBe("#000000");
  });

  it("preserves the branded button and status semantics", () => {
    const { rerender } = render(<Button>Comprar</Button>);
    expect(screen.getByRole("button", { name: "Comprar" })).toHaveClass("button", "button--primary");

    rerender(<Button variant="ghost">Entrar</Button>);
    expect(screen.getByRole("button", { name: "Entrar" })).toHaveClass("button", "button--ghost");

    render(<Status status="VALID" />);
    expect(screen.getByText("VALID")).toHaveAttribute("data-status", "VALID");
  });
});
