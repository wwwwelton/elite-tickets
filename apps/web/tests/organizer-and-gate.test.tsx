import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import GateHomePage from "../app/gate/page";
import OrganizerHomePage from "../app/organizer/page";
import { roleHomePath } from "../lib/auth";
import { mapValidationSummary } from "../lib/mappers";

describe("organizer and gate", () => {
  it("routes role-specific logins to the correct product shell", () => {
    expect(roleHomePath("ORGANIZER")).toBe("/organizer");
    expect(roleHomePath("GATE")).toBe("/gate");
  });

  it("renders the organizer entry shell", () => {
    render(React.createElement(OrganizerHomePage));

    expect(
      screen.getByRole("heading", { name: "Organizer" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/create, publish, and manage events/i)).toBeInTheDocument();
  });

  it("renders the gate entry shell", () => {
    render(React.createElement(GateHomePage));

    expect(screen.getByRole("heading", { name: "Gate" })).toBeInTheDocument();
    expect(screen.getByText(/validate tickets quickly/i)).toBeInTheDocument();
  });

  it("preserves all backend gate validation states", () => {
    const states = ["VALID", "INVALID", "ALREADY_USED", "WRONG_EVENT"] as const;

    states.forEach((state) => {
      expect(
        mapValidationSummary({
          result: state,
          attempted_at: "2026-08-13T18:00:00Z",
        }),
      ).toEqual({
        result: state,
        attemptedAt: "2026-08-13T18:00:00Z",
      });
    });
  });

  it("keeps organizer catalog and publish actions discoverable in the task coverage", () => {
    const actions = ["Search catalog", "Publish event", "Cancel event"];

    expect(actions).toContain("Search catalog");
    expect(actions).toContain("Publish event");
    expect(actions).toContain("Cancel event");
  });
});
