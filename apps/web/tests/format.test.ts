import { describe, expect, it } from "vitest";
import {
  formatCountdown,
  formatMoney,
  formatShortDate,
  multiplyPrice,
} from "@/lib/format";

describe("formatting helpers", () => {
  it("formats backend decimal strings as money", () => {
    expect(formatMoney("18.00")).toBe("R$ 18,00");
    expect(formatMoney(undefined)).toBe("—");
    expect(formatMoney("not-a-number")).toBe("—");
  });

  it("multiplies the unit price by the selected quantity", () => {
    expect(multiplyPrice("18.00", 3)).toBe(54);
    expect(multiplyPrice(undefined, 3)).toBe(0);
  });

  it("degrades gracefully when a date is missing or invalid", () => {
    expect(formatShortDate(undefined)).toBe("A definir");
    expect(formatShortDate("not-a-date")).toBe("A definir");
  });

  it("counts a hold down in minutes and seconds", () => {
    expect(formatCountdown(165_000)).toBe("02:45");
    expect(formatCountdown(-5)).toBe("00:00");
  });
});
