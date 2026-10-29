import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "@/app/page";

describe("Home", () => {
  it("renders the product name and planning-state message", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: "little things." }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Your personal collection library"),
    ).toBeInTheDocument();
  });
});
