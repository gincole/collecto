import { act } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";

describe("component test runtime", () => {
  it("uses React test APIs even when the deployment process is production", () => {
    expect(process.env.NODE_ENV).toBe("test");
    expect(act).toBeTypeOf("function");
    render(<Button>Ready</Button>);
    expect(screen.getByRole("button", { name: "Ready" })).toBeVisible();
  });
});
