import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ShareAction } from "@/components/tickets/share-action";

const shareUrl = "https://tickets.example.test/shared/tickets/public-token";

describe("ticket sharing action", () => {
  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    writeText.mockClear();
    window.sessionStorage.setItem(
      "elite-tickets.session",
      JSON.stringify({
        accessToken: "customer-token",
        expiresAt: Date.now() + 15 * 60 * 1000,
        role: "CUSTOMER",
      }),
    );
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test/api/v1");
  });

  afterEach(() => {
    window.sessionStorage.clear();
    Reflect.deleteProperty(window.navigator, "clipboard");
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("creates a read-only link, copies it, and preserves ownership guidance", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ share_url: shareUrl }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<ShareAction ticketId="ticket / 42" />);
    const region = screen.getByRole("region", { name: "Compartilhamento do ingresso" });
    fireEvent.click(screen.getByRole("button", { name: "Compartilhar ingresso" }));

    const link = await screen.findByLabelText("Link público somente leitura");
    expect(link).toHaveValue(shareUrl);
    expect(link).toHaveAttribute("readonly");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Link copiado. O ingresso continua pertencendo a você.",
    );
    expect(region).toContainElement(screen.getByRole("button", { name: "Copiar link" }));
    expect(writeText).toHaveBeenCalledWith(shareUrl);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [requestUrl, requestOptions] = fetchMock.mock.calls[0] ?? [];
    expect(String(requestUrl)).toBe(
      "https://api.example.test/api/v1/me/tickets/ticket%20%2F%2042/share",
    );
    expect(requestOptions).toMatchObject({
      cache: "no-store",
      credentials: "omit",
      method: "POST",
      redirect: "error",
      referrerPolicy: "no-referrer",
    });
    expect(new Headers(requestOptions?.headers).get("Authorization")).toBe(
      "Bearer customer-token",
    );

    fireEvent.click(screen.getByRole("button", { name: "Copiar link" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(2));
  });

  it("keeps the shared link field read-only once created", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ share_url: shareUrl }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<ShareAction ticketId="ticket-2" />);
    fireEvent.click(screen.getByRole("button", { name: "Compartilhar ingresso" }));

    const link = await screen.findByLabelText("Link público somente leitura");
    expect(link).toHaveAttribute("readonly");
    expect(link).toHaveValue(shareUrl);
    expect(screen.getByRole("status")).toHaveTextContent("Link copiado. O ingresso continua pertencendo a você.");
  });

  it("announces an expired session without calling the share endpoint", async () => {
    window.sessionStorage.clear();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<ShareAction ticketId="ticket-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Compartilhar ingresso" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Sua sessão expirou. Entre novamente para compartilhar.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
