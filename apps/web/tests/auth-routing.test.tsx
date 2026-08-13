import { describe, expect, it } from "vitest";
import { roleHomePath, toSessionState } from "@/lib/auth";

describe("auth routing", () => {
  it("routes each role to its role home", () => {
    expect(roleHomePath("CUSTOMER")).toBe("/customer");
    expect(roleHomePath("ORGANIZER")).toBe("/organizer");
    expect(roleHomePath("GATE")).toBe("/gate");
  });

  it("maps token login responses into session state", () => {
    expect(
      toSessionState({
        access_token: "token",
        expires_in: 900,
        role: "CUSTOMER",
      }),
    ).toEqual({
      accessToken: "token",
      expiresIn: 900,
      role: "CUSTOMER",
    });
  });
});
