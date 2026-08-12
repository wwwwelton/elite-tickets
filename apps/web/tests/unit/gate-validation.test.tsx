import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ValidationResult } from "@/components/tickets/validation-result";

describe("gate validation results", () => {
  it.each(["VALID", "INVALID", "ALREADY_USED", "WRONG_EVENT"] as const)("announces %s with text and focus", (result) => {
    render(<ValidationResult result={result} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("data-validation-result", result);
    expect(alert).toHaveAttribute("tabindex", "-1");
    expect(alert).toHaveTextContent(result === "VALID" ? "Entrada autorizada" : /Entrada|ingresso/i);
  });
});
