import Link from "next/link";

import { PageContainer } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { LibraryError } from "@/features/collections/library-error";
import { LibraryView } from "@/features/collections/library-view";
import { listCollectionsQuery } from "@/features/collections/queries";

export default async function LibraryPage() {
  const result = await listCollectionsQuery();

  return (
    <PageContainer as="main">
      <header className="flex flex-col gap-5 py-2 sm:flex-row sm:items-end sm:justify-between sm:py-4">
        <div className="space-y-2">
          <p className="text-foreground-muted text-sm font-semibold tracking-[0.16em] uppercase">
            Your private collection space
          </p>
          <h1 className="text-page-title-mobile sm:text-page-title">
            My Collections
          </h1>
          <p className="text-foreground-muted max-w-xl">
            A home for everything you love, notice, and want to keep close.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto" size="lg">
          <Link href="/collections/new">New collection</Link>
        </Button>
      </header>

      <section aria-label="Collections" className="pt-6 sm:pt-8">
        {result.status === "success" ? (
          <LibraryView collections={result.data} />
        ) : (
          <LibraryError />
        )}
      </section>
    </PageContainer>
  );
}
