import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import GateHomePage from "../app/gate/page";
import OrganizerHomePage from "../app/organizer/page";
import { roleHomePath } from "../lib/auth";

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
});
