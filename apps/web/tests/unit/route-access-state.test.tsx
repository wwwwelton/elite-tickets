import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RouteAccessState } from "@/components/auth/route-access-state";

describe("RouteAccessState", () => {
  it("renders a reviewable auth-required message and action", () => {
    render(
      <RouteAccessState
        title="Acesso necessário"
        message="Entre para continuar"
        actionHref="/login"
        actionLabel="Entrar"
      />,
    );

    expect(screen.getByRole("alert")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Entre para continuar" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/login");
  });
});
