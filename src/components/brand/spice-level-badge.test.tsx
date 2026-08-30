/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SpiceLevelBadge } from "./spice-level-badge";

describe("SpiceLevelBadge", () => {
  it("renders three theme SVGs and fills only the active chillies", () => {
    const { container } = render(<SpiceLevelBadge level={1} label="Mild, 1 of 3 chillies" />);
    expect(screen.getByRole("img", { name: "Mild, 1 of 3 chillies" })).toBeTruthy();
    const icons = container.querySelectorAll("svg");
    expect(icons).toHaveLength(3);
    expect(icons[0]?.innerHTML).toContain("fill-earth");
    expect(icons[0]?.innerHTML).toContain("stroke-forest");
    expect(icons[1]?.innerHTML).not.toContain("fill-earth");
    expect(icons[2]?.innerHTML).not.toContain("fill-earth");
    expect(container.querySelector("img")).toBeNull();
  });
});
