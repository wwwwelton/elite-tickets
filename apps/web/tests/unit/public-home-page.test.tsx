import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, apiRequest: mocks.apiRequest };
});

import Home from "@/app/(public)/page";

describe("PublicHomePage", () => {
  beforeEach(() => {
    mocks.apiRequest.mockReset();
  });

  it("surfaces search and login entry points", async () => {
    mocks.apiRequest.mockResolvedValue({
      items: [],
      page: 1,
      total: 0,
    });

    const page = await Home({
      searchParams: Promise.resolve({ query: "" }),
    });
    render(page);

    expect(screen.getByLabelText("Filme ou local")).toBeVisible();
    expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Área do organizador" })).toHaveAttribute(
      "href",
      "/organizer/events",
    );
  });
});
