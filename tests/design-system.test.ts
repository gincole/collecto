import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
const layout = readFileSync(join(process.cwd(), "app/layout.tsx"), "utf8");

function readCssProperty(name: string) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`--${escapedName}:\\s*([^;]+);`));

  if (!match?.[1]) {
    throw new Error(`Missing CSS property --${name}`);
  }

  return match[1].trim();
}

function relativeLuminance(hex: string) {
  const channels = hex
    .replace("#", "")
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );

  if (!channels || channels.length !== 3) {
    throw new Error(`Expected a six-digit hex color, received ${hex}`);
  }

  const [red, green, blue] = channels;

  if (red === undefined || green === undefined || blue === undefined) {
    throw new Error(`Expected RGB channels, received ${hex}`);
  }

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

describe("design-system tokens", () => {
  it("supports safe areas without disabling browser zoom", () => {
    expect(layout).toContain('viewportFit: "cover"');
    expect(layout).not.toMatch(/userScalable:\s*false|maximumScale:\s*1/);
  });
  it("applies the approved DESIGN.md zinc palette and border-led geometry", () => {
    for (const [token, value] of Object.entries({
      background: "#f4f4f5",
      surface: "#ffffff",
      "surface-muted": "#fafafa",
      foreground: "#09090b",
      "foreground-muted": "#52525b",
      border: "#ececee",
      "radius-card": "2.25rem",
      "radius-control": "0.875rem",
      "radius-badge": "0.75rem",
      "radius-artwork": "2.5rem",
      "container-page": "75rem",
      "shadow-card": "none",
      "text-display": "4rem",
      "text-page-title": "2.5rem",
      "text-section-title": "2rem",
    }))
      expect(readCssProperty(token), token).toBe(value);
    expect(css).toContain("scrollbar-gutter: stable");
    for (const name of [
      "lavender",
      "sage",
      "peach",
      "butter",
      "sky",
      "rose",
      "sand",
      "mint",
    ]) {
      const color = readCssProperty(`art-${name}`);
      const rgb = color
        .slice(1)
        .match(/.{2}/g)
        ?.map((channel) => Number.parseInt(channel, 16));
      expect(
        rgb && Math.max(...rgb) - Math.min(...rgb),
        name,
      ).toBeLessThanOrEqual(6);
    }
  });
  it("defines the complete semantic and preset color contract", () => {
    const requiredColors = [
      "background",
      "surface",
      "surface-muted",
      "foreground",
      "foreground-muted",
      "border",
      "control-border",
      "focus",
      "destructive",
      "error",
      "success",
      "disabled-surface",
      "disabled-foreground",
      "selection-border",
      "art-lavender",
      "art-sage",
      "art-peach",
      "art-butter",
      "art-sky",
      "art-rose",
      "art-sand",
      "art-mint",
    ];

    for (const token of requiredColors) {
      expect(readCssProperty(token), `--${token}`).toMatch(/^#[0-9a-f]{6}$/i);
      expect(css).toContain(`--color-${token}: var(--${token});`);
    }
  });

  it("keeps normal and state text at AA contrast on supported surfaces", () => {
    const pairs = [
      ["foreground", "background"],
      ["foreground", "surface"],
      ["foreground-muted", "background"],
      ["foreground-muted", "surface"],
      ["foreground-muted", "surface-muted"],
      ["error", "surface"],
      ["success", "surface"],
    ] as const;

    for (const [foreground, background] of pairs) {
      expect(
        contrastRatio(readCssProperty(foreground), readCssProperty(background)),
        `${foreground} on ${background}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps interactive control boundaries at non-text contrast", () => {
    for (const background of ["background", "surface"] as const) {
      expect(
        contrastRatio(
          readCssProperty("control-border"),
          readCssProperty(background),
        ),
        `control-border on ${background}`,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it("defines typography, layout, radius, elevation, and motion tokens", () => {
    const requiredTokens = [
      "font-sans",
      "text-display",
      "text-display-mobile",
      "text-page-title",
      "text-page-title-mobile",
      "text-section-title",
      "text-card-title",
      "text-card-title-mobile",
      "text-body",
      "text-body-sm",
      "text-label",
      "text-caption",
      "spacing",
      "spacing-page-mobile",
      "spacing-page-tablet",
      "spacing-page-desktop",
      "container-page",
      "container-narrow",
      "radius-control",
      "radius-card",
      "radius-dialog",
      "radius-pill",
      "shadow-card",
      "shadow-sheet",
      "shadow-dialog",
      "ease-standard",
      "duration-fast",
      "duration-base",
      "duration-dialog",
      "duration-sheet",
      "duration-gallery",
      "transition-duration-fast",
      "transition-duration-base",
      "transition-duration-dialog",
      "transition-duration-sheet",
      "transition-duration-gallery",
      "breakpoint-sm",
      "breakpoint-md",
      "breakpoint-lg",
      "breakpoint-xl",
      "breakpoint-2xl",
    ];

    for (const token of requiredTokens) {
      expect(() => readCssProperty(token), `--${token}`).not.toThrow();
    }

    expect(readCssProperty("text-label--font-weight")).toBe("500");
    expect(readCssProperty("text-card-title-mobile")).toBe("1.125rem");
    expect(readCssProperty("text-caption")).toBe("0.75rem");
  });

  it("provides global focus, touch target, and reduced-motion foundations", () => {
    expect(css).toContain("@utility touch-target");
    expect(css).toContain("min-height: 2.75rem");
    expect(css).toContain(":focus-visible");
    expect(css).toContain("outline: 2px solid var(--focus)");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation-duration: 0.01ms !important");
    expect(css).toContain("transition-duration: 0.01ms !important");
    expect(css).not.toContain("transform: translate(-50%");
  });

  it("configures optimized English and Thai font variables on the root layout", () => {
    expect(layout).toContain("DM_Sans");
    expect(layout).toContain("Noto_Sans_Thai");
    expect(layout).toContain('variable: "--font-dm-sans"');
    expect(layout).toContain('variable: "--font-noto-thai"');
    expect(layout).toContain("dmSans.variable");
    expect(layout).toContain("notoSansThai.variable");
    expect(layout).toContain('data-scroll-behavior="smooth"');
  });
});
