import { describe, expect, it, vi } from "vitest";

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import Home from "@/app/page";

describe("Home", () => {
  it("enters the authenticated journey through the Library route", () => {
    expect(() => Home()).toThrow("NEXT_REDIRECT");

    expect(redirectMock).toHaveBeenCalledWith("/library");
  });
});
