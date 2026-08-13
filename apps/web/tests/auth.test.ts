import { beforeEach, describe, expect, it } from "vitest";
import {
  clearStoredSession,
  isExpired,
  readStoredSession,
  roleHomePath,
  toSessionState,
  writeStoredSession,
} from "@/lib/auth";

describe("session state", () => {
  beforeEach(() => {
    clearStoredSession();
  });

  it("routes every backend role to its own experience", () => {
    expect(roleHomePath("CUSTOMER")).toBe("/customer");
    expect(roleHomePath("ORGANIZER")).toBe("/organizer/events");
    expect(roleHomePath("GATE")).toBe("/gate");
  });

  it("turns the token response into an absolute expiry", () => {
    const session = toSessionState(
      { access_token: "token", expires_in: 900, role: "CUSTOMER" },
      { email: "customer@example.com", displayName: "Jane Customer" },
    );

    expect(session.accessToken).toBe("token");
    expect(session.role).toBe("CUSTOMER");
    expect(session.displayName).toBe("Jane Customer");
    expect(session.expiresAt).toBeGreaterThan(Date.now());
    expect(isExpired(session)).toBe(false);
  });

  it("falls back to the email handle when no display name is supplied", () => {
    const session = toSessionState(
      { access_token: "token", expires_in: 900, role: "GATE" },
      { email: "gate@example.com" },
    );

    expect(session.displayName).toBe("gate");
  });

  it("round-trips a stored session", () => {
    const session = toSessionState(
      { access_token: "token", expires_in: 900, role: "ORGANIZER" },
      { email: "organizer@example.com" },
    );
    writeStoredSession(session);

    expect(readStoredSession()).toEqual(session);
  });

  it("drops an expired session instead of returning it", () => {
    writeStoredSession({
      accessToken: "token",
      expiresAt: Date.now() - 1000,
      role: "CUSTOMER",
      email: "customer@example.com",
      displayName: "Jane",
    });

    expect(readStoredSession()).toBeNull();
  });

  it("drops a corrupted session payload", () => {
    window.localStorage.setItem("elite-tickets.session", "{not json");

    expect(readStoredSession()).toBeNull();
  });
});
