import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useReducedMotion } from "@/lib/design/use-reduced-motion";

afterEach(() => vi.unstubAllGlobals());

it("updates reduced motion while mounted and removes its media subscription", () => {
  let changed = () => {};
  const media = {
    matches: false,
    addEventListener: vi.fn((_event: string, listener: () => void) => {
      changed = listener;
    }),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => media),
  );
  const hook = renderHook(() => useReducedMotion());
  expect(hook.result.current).toBe(false);
  act(() => {
    media.matches = true;
    changed();
  });
  expect(hook.result.current).toBe(true);
  hook.unmount();
  expect(media.removeEventListener).toHaveBeenCalledWith("change", changed);
});

it("supports environments without a motion media API", () => {
  vi.stubGlobal("matchMedia", undefined);
  expect(renderHook(() => useReducedMotion()).result.current).toBe(false);
});
