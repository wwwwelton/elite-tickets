import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  eventForm: vi.fn(() => <div>Formulário do evento</div>),
}));

vi.mock("@/components/events/event-form", () => ({
  EventForm: mocks.eventForm,
}));

import NewOrganizerEventPage from "@/app/organizer/events/new/page";

describe("NewOrganizerEventPage", () => {
  it("surfaces a return path to organizer events", () => {
    render(<NewOrganizerEventPage />);

    expect(screen.getByRole("link", { name: "Voltar aos meus eventos" })).toHaveAttribute(
      "href",
      "/organizer/events",
    );
    expect(mocks.eventForm).toHaveBeenCalledWith({}, undefined);
  });
});
