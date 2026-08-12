import { beforeEach, describe, expect, it } from "vitest";

import {
  PUBLIC_NAVIGATION,
  NAVIGATION_BY_ROLE,
  clearSession,
  authenticatedActionForSession,
  guardRoute,
  getSession,
  roleHome,
  saveSession,
  primaryNavigationForSession,
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
    expect(guardRoute(["CUSTOMER"])).toEqual({
      allowed: false,
      redirectTo: "/gate",
      reason: "access_denied",
    });
  });

  it("redirects signed-out visitors to the login entry", () => {
    expect(guardRoute(["CUSTOMER"])).toEqual({
      allowed: false,
      redirectTo: "/login",
      reason: "auth_required",
    });
  });

  it("exposes shared and role-specific navigation helpers for the shell", () => {
    expect(primaryNavigationForSession(null)).toEqual(PUBLIC_NAVIGATION);
    expect(authenticatedActionForSession(null)).toBeNull();

    saveSession({
      access_token: "token",
      token_type: "bearer",
      expires_in: 900,
      role: "ORGANIZER",
    });

    const session = getSession();
    expect(session?.role).toBe("ORGANIZER");
    expect(primaryNavigationForSession(session)).toEqual([
      { href: "/", label: "Início" },
      ...NAVIGATION_BY_ROLE.ORGANIZER,
    ]);
    expect(authenticatedActionForSession(session)).toBe("Meus eventos");
  });
});
