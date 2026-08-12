import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/components/auth/login-form";
import { ApiError } from "@/lib/api";

const mocks = vi.hoisted(() => ({
  apiMutation: vi.fn(),
  replace: vi.fn(),
  roleHome: vi.fn(),
  saveSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, apiMutation: mocks.apiMutation };
});

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    roleHome: mocks.roleHome,
    saveSession: mocks.saveSession,
  };
});

describe("LoginForm", () => {
  beforeEach(() => {
    mocks.apiMutation.mockReset();
    mocks.replace.mockReset();
    mocks.roleHome.mockReset();
    mocks.saveSession.mockReset();
  });

  it("saves the JWT session and redirects to the authenticated role home", async () => {
    const token = {
      access_token: "customer-token",
      token_type: "bearer",
      expires_in: 900,
      role: "CUSTOMER",
    } as const;
    const session = {
      accessToken: token.access_token,
      expiresAt: Date.now() + token.expires_in * 1000,
      role: token.role,
    };
    mocks.apiMutation.mockResolvedValue(token);
    mocks.saveSession.mockReturnValue(session);
    mocks.roleHome.mockReturnValue("/customer/tickets");

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "customer@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "Customer123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(mocks.apiMutation).toHaveBeenCalledWith("/auth/token", {
        body: {
          email: "customer@example.com",
          password: "Customer123!",
        },
      });
    });
    expect(mocks.saveSession).toHaveBeenCalledWith(token);
    expect(mocks.roleHome).toHaveBeenCalledWith("CUSTOMER");
    expect(mocks.replace).toHaveBeenCalledWith("/customer/tickets");
  });

  it("keeps the form available and announces authentication errors", async () => {
    mocks.apiMutation.mockRejectedValue(
      new ApiError(401, "invalid_credentials", "E-mail ou senha inválidos."),
    );

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "customer@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "senha-incorreta" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha inválidos.");
    expect(screen.getByRole("button", { name: "Entrar" })).toBeEnabled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("marks the submit action busy while the login request is pending", async () => {
    let resolveRequest: (value: unknown) => void;
    const pendingRequest = new Promise((resolve) => {
      resolveRequest = resolve;
    });
    mocks.apiMutation.mockReturnValue(pendingRequest);

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "customer@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "Customer123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(screen.getByRole("button", { name: "Entrando…" })).toBeDisabled();
    expect(screen.getByRole("form", { name: "Acesso à conta" })).toHaveAttribute("aria-busy", "true");

    resolveRequest?.({
      access_token: "customer-token",
      token_type: "bearer",
      expires_in: 900,
      role: "CUSTOMER",
    });
    await pendingRequest;
  });
});
