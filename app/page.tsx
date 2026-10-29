export default function Home() {
  return (
    <main className="max-w-page px-page-mobile sm:px-page-tablet lg:px-page-desktop mx-auto flex min-h-screen items-center py-12">
      <section aria-labelledby="page-title" className="space-y-4">
        <p className="text-label text-foreground-muted tracking-[0.2em] uppercase">
          Personal collection library
        </p>
        <h1
          className="text-display-mobile sm:text-display text-foreground tracking-tight"
          id="page-title"
        >
          little things.
        </h1>
        <p className="text-foreground-muted max-w-xl text-lg leading-8">
          Your personal collection library
        </p>
      </section>
    </main>
  );
}
