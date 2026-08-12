import { describe, expect, it } from "vitest";

import nextConfig from "@/next.config";

describe("external event image configuration", () => {
  it("allows Ticketmaster discovery images without removing legacy posters", () => {
    expect(nextConfig.images?.remotePatterns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          protocol: "https",
          hostname: "s1.ticketm.net",
          pathname: "/dam/**",
        }),
        expect.objectContaining({
          protocol: "https",
          hostname: "image.tmdb.org",
          pathname: "/t/p/**",
        }),
      ]),
    );
  });
});
