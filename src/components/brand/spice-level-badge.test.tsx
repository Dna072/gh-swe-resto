/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SpiceLevelBadge } from "./spice-level-badge";

describe("SpiceLevelBadge", () => {
  it("fills chillies up to the given level", () => {
    const { container } = render(<SpiceLevelBadge level={1} label="Mild, 1 of 3 chillies" />);
    expect(screen.getByRole("img", { name: "Mild, 1 of 3 chillies" })).toBeTruthy();
    const icons = container.querySelectorAll("img");
    expect(icons).toHaveLength(3);
    expect(icons[0]?.className).not.toMatch(/grayscale/);
    expect(icons[1]?.className).toMatch(/grayscale/);
    expect(icons[2]?.className).toMatch(/grayscale/);
  });
});
