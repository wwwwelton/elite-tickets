import { beforeEach, describe, expect, it } from "vitest";

import {
  NAVIGATION_BY_ROLE,
  clearSession,
  guardRoute,
  roleHome,
  saveSession,
} from "@/lib/auth";

describe("role navigation", () => {
  beforeEach(() => clearSession());

  it.each([
    ["ORGANIZER", "/organizer/events"],
    ["CUSTOMER", "/customer/tickets"],
    ["GATE", "/gate"],
  ] as const)("routes %s to its own home", (role, home) => {
    expect(roleHome(role)).toBe(home);
    expect(NAVIGATION_BY_ROLE[role][0].href).toBe(home);
  });

  it("redirects an authenticated role away from another role's route", () => {
    saveSession({ access_token: "token", token_type: "bearer", expires_in: 900, role: "GATE" });
    expect(guardRoute(["CUSTOMER"])).toEqual({ allowed: false, redirectTo: "/gate" });
  });
});
