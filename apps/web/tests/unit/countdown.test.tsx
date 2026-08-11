import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Countdown, remainingSeconds } from "@/components/checkout/countdown";

describe("reservation countdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-11T12:00:00Z"));
  });

  afterEach(() => vi.useRealTimers());

  it("rounds remaining time up and never becomes negative", () => {
    expect(remainingSeconds("2026-08-11T12:00:01.001Z")).toBe(2);
    expect(remainingSeconds("2026-08-11T11:59:59Z")).toBe(0);
  });

  it("announces the final minute and expiration", () => {
    const onExpire = vi.fn();
    render(<Countdown expiresAt="2026-08-11T12:00:01Z" onExpire={onExpire} />);
    const timer = screen.getByRole("timer");
    expect(timer).toHaveAttribute("aria-live", "polite");
    expect(timer).toHaveTextContent("Tempo restante: 00:01");

    act(() => vi.advanceTimersByTime(1_000));
    expect(timer).toHaveTextContent("Reserva expirada");
    expect(onExpire).toHaveBeenCalled();
  });
});
