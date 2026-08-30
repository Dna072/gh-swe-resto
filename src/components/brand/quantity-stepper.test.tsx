/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { QuantityStepper } from "./quantity-stepper";

function Harness() {
  const [value, setValue] = useState(1);
  return <QuantityStepper value={value} onChange={setValue} label="Quantity" />;
}

describe("QuantityStepper", () => {
  it("increments and decrements without going below one", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Increase Quantity" }));
    expect(screen.getByText("2")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Decrease Quantity" }));
    await user.click(screen.getByRole("button", { name: "Decrease Quantity" }));
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Decrease Quantity" })).toHaveProperty("disabled", true);
  });
});
