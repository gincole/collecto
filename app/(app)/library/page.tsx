import { PageContainer } from "@/components/shared";

export default function LibraryPage() {
  return (
    <PageContainer as="main">
      <section
        aria-labelledby="library-title"
        className="space-y-3 py-6 sm:py-10"
      >
        <p className="text-foreground-muted text-sm font-semibold tracking-[0.16em] uppercase">
          Your private collection space
        </p>
        <h1
          className="text-page-title-mobile sm:text-page-title"
          id="library-title"
        >
          My Library
        </h1>
        <p className="text-foreground-muted max-w-xl">
          Your collections will appear here when you start gathering the things
          you want to remember.
        </p>
      </section>
    </PageContainer>
  );
}
