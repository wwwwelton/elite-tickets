import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/auth/login-form", () => ({
  LoginForm: () => <div>Login form</div>,
}));

import LoginPage from "@/app/login/page";

describe("LoginPage", () => {
  it("exposes explicit entry navigation and role guidance", () => {
    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: "Entrar" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Início" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("list", { name: "Experiências disponíveis por perfil" })).toBeVisible();
  });
});
