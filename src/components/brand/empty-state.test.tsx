/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";

describe("states", () => {
  it("renders an empty cart message", () => {
    render(<EmptyState title="Your cart is empty" description="Add a meal to start." />);
    expect(screen.getByRole("heading", { name: "Your cart is empty" })).toBeTruthy();
  });

  it("exposes errors to assistive tech", () => {
    render(<ErrorState message="Delivery is temporarily unavailable." />);
    expect(screen.getByText("Delivery is temporarily unavailable.")).toBeTruthy();
  });
});
