import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { GateStatus } from "@/components/gate/gate-status";
import type { GateValidationApi } from "@/lib/api";

const results: Array<[GateValidationApi["result"], RegExp]> = [
  ["VALID", /entry approved/i],
  ["INVALID", /credential not recognized/i],
  ["ALREADY_USED", /already admitted/i],
  ["WRONG_EVENT", /another event/i],
];

describe("gate validation outcomes", () => {
  it.each(results)("renders %s with text, not colour alone", (result, note) => {
    render(
      <GateStatus
        validation={{ result, attempted_at: "2026-08-13T18:00:00Z" }}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(note)).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`^${result.replace("_", " ")}$`, "i")),
    ).toBeInTheDocument();
  });

  it("always offers a way back to scanning", () => {
    const onDismiss = vi.fn();
    render(
      <GateStatus
        validation={{ result: "INVALID", attempted_at: "2026-08-13T18:00:00Z" }}
        onDismiss={onDismiss}
      />,
    );

    screen.getByRole("button", { name: /scan next ticket/i }).click();
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
