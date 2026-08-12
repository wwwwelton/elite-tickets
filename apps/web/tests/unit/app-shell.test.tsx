import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/auth/app-shell";
import { clearSession, saveSession } from "@/lib/auth";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  pathname: "/",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

describe("AppShell", () => {
  beforeEach(() => {
    clearSession();
    mocks.push.mockReset();
    mocks.refresh.mockReset();
    mocks.pathname = "/";
  });

  it("shows public navigation and signed-out login entry", () => {
    render(
      <AppShell>
        <p>Conteúdo</p>
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Área do organizador" })).toHaveAttribute(
      "href",
      "/organizer/events",
    );
    expect(screen.getByRole("link", { name: "Portaria" })).toHaveAttribute("href", "/gate");
  });

  it("shows customer navigation and supports logout", () => {
    saveSession({
      access_token: "customer-token",
      token_type: "bearer",
      expires_in: 900,
      role: "CUSTOMER",
    });

    render(
      <AppShell>
        <p>Conteúdo</p>
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: "Início" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Meus ingressos" })).toHaveAttribute(
      "href",
      "/customer/tickets",
    );
    expect(screen.getByRole("button", { name: "Sair" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Sair" }));

    expect(mocks.push).toHaveBeenCalledWith("/");
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("closes the mobile menu with Escape", () => {
    render(
      <AppShell>
        <p>Conteúdo</p>
      </AppShell>,
    );

    const toggle = screen.getByRole("button", { name: "Abrir menu" });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
