export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-5 py-12 sm:px-8">
      <section aria-labelledby="page-title" className="space-y-4">
        <p className="text-sm font-semibold tracking-[0.2em] text-neutral-500 uppercase">
          Personal collection library
        </p>
        <h1
          className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-6xl"
          id="page-title"
        >
          little things.
        </h1>
        <p className="max-w-xl text-lg leading-8 text-neutral-600">
          Your personal collection library
        </p>
      </section>
    </main>
  );
}
