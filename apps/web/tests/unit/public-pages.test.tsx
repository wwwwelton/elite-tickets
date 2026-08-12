import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, apiRequest: mocks.apiRequest };
});

import { EventCard } from "@/components/events/event-card";
import { EventList } from "@/components/events/event-list";
import type { PublicEvent } from "@/components/events/types";
import Home from "@/app/(public)/page";

const event: PublicEvent = {
  id: "event-1",
  state: "PUBLISHED",
  title: "Sessão Elite",
  poster_url: "https://image.tmdb.org/t/p/w500/poster.jpg",
  starts_at: "2030-06-01T22:00:00Z",
  ends_at: "2030-06-02T00:00:00Z",
  venue_name: "Cinema Central",
  capacity: 10,
  sold_quantity: 3,
  available_quantity: 5,
  price: "25.50",
};

describe("public catalog and detail rendering", () => {
  beforeEach(() => {
    mocks.apiRequest.mockReset();
  });

  it("renders an event card with ticket semantics", () => {
    render(<EventCard event={event} />);

    expect(screen.getByRole("article")).toHaveClass("ticket");
    expect(screen.getByRole("heading", { name: "Sessão Elite" })).toBeVisible();
    expect(screen.getByText("AVAILABLE")).toBeVisible();
    expect(screen.getByRole("link", { name: "Ver evento" })).toHaveAttribute("href", "/events/event-1");
  });

  it("renders the empty state for the public catalog", () => {
    render(<EventList events={[]} />);
    expect(screen.getByRole("status")).toHaveTextContent("Nenhum evento publicado encontrado.");
  });

  it("keeps the public discovery and authentication entry points visible", async () => {
    mocks.apiRequest.mockResolvedValue({
      items: [event],
      page: 1,
      total: 1,
    });

    const page = await Home({
      searchParams: Promise.resolve({ query: "" }),
    });
    render(page);

    expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/login");
    expect(screen.getByLabelText("Filme ou local")).toBeVisible();
    expect(screen.getByRole("button", { name: "Pesquisar" })).toBeVisible();
  });
});
