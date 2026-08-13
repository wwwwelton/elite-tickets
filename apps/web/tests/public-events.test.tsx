import { describe, expect, it } from "vitest";
import { eventsFixture } from "./fixtures/events";
import { mapEventSummary } from "../lib/mappers";

describe("public events", () => {
  it("maps the event summary fields used by discovery", () => {
    const event = mapEventSummary(eventsFixture[0]);

    expect(event.title).toBe("Neon Horizon");
    expect(event.startsAt).toBe("2026-09-10T20:00:00Z");
    expect(event.venueName).toBe("Grand Cinema");
  });

  it("keeps the earliest event first for discovery ordering", () => {
    const ordered = [...eventsFixture].sort((left, right) =>
      left.starts_at.localeCompare(right.starts_at),
    );

    expect(ordered[0].id).toBe("event-1");
  });
});
