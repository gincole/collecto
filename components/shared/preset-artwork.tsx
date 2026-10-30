import {
  BookOpen,
  Clapperboard,
  Gem,
  Heart,
  Music2,
  Sparkles,
  Plane,
  ShoppingBag,
  Utensils,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils/cn";

const presetArtwork = {
  blank: { color: "bg-art-mint", icon: Sparkles },
  book: { color: "bg-art-lavender", icon: BookOpen },
  favorites: { color: "bg-art-rose", icon: Heart },
  meal: { color: "bg-art-sage", icon: Utensils },
  merch: { color: "bg-art-peach", icon: Gem },
  movie: { color: "bg-art-sky", icon: Clapperboard },
  shopping: { color: "bg-art-sand", icon: ShoppingBag },
  song: { color: "bg-art-rose", icon: Music2 },
  travel: { color: "bg-art-butter", icon: Plane },
} satisfies Record<string, { color: string; icon: LucideIcon }>;

type PresetKey = keyof typeof presetArtwork;
type PresetArtworkSize = "sm" | "md" | "lg";
type PresetArtworkVariant = "icon" | "tile" | "cover";

const sizeStyles: Record<
  PresetArtworkSize,
  { container: string; icon: string }
> = {
  lg: { container: "size-16 sm:size-24", icon: "size-7 sm:size-10" },
  md: { container: "size-12 sm:size-16", icon: "size-6 sm:size-7" },
  sm: { container: "size-10 sm:size-12", icon: "size-4 sm:size-5" },
};

type PresetArtworkProps = {
  className?: string;
  presetKey: PresetKey;
  size?: PresetArtworkSize;
  variant?: PresetArtworkVariant;
};

function PresetArtwork({
  className,
  presetKey,
  size = "md",
  variant = "tile",
}: PresetArtworkProps) {
  const { color, icon: Icon } = presetArtwork[presetKey];

  return (
    <span
      aria-hidden="true"
      className={cn(
        "text-foreground inline-flex shrink-0 items-center justify-center",
        color,
        variant === "cover" ? "size-full" : sizeStyles[size].container,
        variant !== "cover" &&
          (variant === "tile" ? "rounded-artwork" : "rounded-pill"),
        className,
      )}
      data-preset={presetKey}
      data-testid="preset-artwork"
    >
      <Icon className={sizeStyles[size].icon} />
    </span>
  );
}

export { PresetArtwork, presetArtwork };
export type {
  PresetArtworkProps,
  PresetArtworkSize,
  PresetArtworkVariant,
  PresetKey,
};
