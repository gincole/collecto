export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="focus-ring bg-foreground text-surface rounded-control sr-only focus:not-sr-only focus:fixed focus:top-[max(0.75rem,env(safe-area-inset-top))] focus:left-[max(0.75rem,env(safe-area-inset-left))] focus:z-[90] focus:px-4 focus:py-3"
    >
      Skip to content
    </a>
  );
}
