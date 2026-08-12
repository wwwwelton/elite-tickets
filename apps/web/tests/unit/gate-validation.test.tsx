import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ValidationResult } from "@/components/tickets/validation-result";

describe("gate validation results", () => {
  it.each(["VALID", "INVALID", "ALREADY_USED", "WRONG_EVENT"] as const)("announces %s with text and focus", (result) => {
    render(<ValidationResult result={result} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("data-validation-result", result);
    expect(alert).toHaveAttribute("tabindex", "-1");
    expect(alert).toHaveTextContent(result === "VALID" ? "Entrada autorizada" : /Entrada|ingresso/i);
    expect(alert).toHaveTextContent(
      result === "VALID"
        ? "✓"
        : result === "INVALID"
          ? "×"
          : result === "ALREADY_USED"
            ? "!"
            : "↔",
    );
  });

  it("exposes a next-validation action when requested", () => {
    const restart = vi.fn();
    render(<ValidationResult result="VALID" onNextAction={restart} nextActionLabel="Próxima leitura" />);

    fireEvent.click(screen.getByRole("button", { name: "Próxima leitura" }));
    expect(restart).toHaveBeenCalledTimes(1);
  });
});
