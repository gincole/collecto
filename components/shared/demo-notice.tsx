export function DemoNotice() {
  return (
    <aside
      aria-label="Shared demo account"
      className="border-border bg-surface-muted border-b"
    >
      <p className="page-insets max-w-page mx-auto py-3 text-sm">
        This is a shared, writable demo. Other visitors can see and change its
        data. The last saved change wins. Use fictional information only; demo
        data may be reset.
      </p>
    </aside>
  );
}
