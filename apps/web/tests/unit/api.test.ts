import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiRequest } from "@/lib/api";

describe("API failure normalization", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("preserves a backend domain error", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test/api/v1");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ error: { code: "conflict", message: "Estado incompatível" } }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    await expect(apiRequest("/resource")).rejects.toMatchObject({
      name: "ApiError",
      status: 409,
      code: "conflict",
      message: "Estado incompatível",
    });
  });

  it("classifies a transport failure without inventing a backend result", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test/api/v1");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    try {
      await apiRequest("/resource");
      throw new Error("request unexpectedly succeeded");
    } catch (caught) {
      expect(caught).toBeInstanceOf(ApiError);
      expect(caught).toMatchObject({ status: 0, code: "network_error" });
    }
  });
});
