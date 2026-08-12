import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, apiRequest: mocks.apiRequest };
});

import { OrganizerLedger } from "@/components/events/organizer-ledger";
import { clearSession, saveSession } from "@/lib/auth";

describe("OrganizerLedger", () => {
  beforeEach(() => {
    clearSession();
    mocks.apiRequest.mockReset();
  });

  it("shows the organizer workspace actions", async () => {
    saveSession({
      access_token: "organizer-token",
      token_type: "bearer",
      expires_in: 900,
      role: "ORGANIZER",
    });
    mocks.apiRequest.mockResolvedValue([]);

    render(<OrganizerLedger />);

    expect(await screen.findByRole("link", { name: "Eventos públicos" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Criar evento" })).toHaveAttribute(
      "href",
      "/organizer/events/new",
    );
  });
});
