import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  organizerLedger: vi.fn(() => <div>Inventário do organizador</div>),
}));

vi.mock("@/components/events/organizer-ledger", () => ({
  OrganizerLedger: mocks.organizerLedger,
}));

import OrganizerEventsPage from "@/app/organizer/events/page";

describe("OrganizerEventsPage", () => {
  it("surfaces a return path to the public event experience", () => {
    render(<OrganizerEventsPage />);

    expect(screen.getByRole("link", { name: "Voltar aos eventos públicos" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(mocks.organizerLedger).toHaveBeenCalledWith({}, undefined);
  });
});
