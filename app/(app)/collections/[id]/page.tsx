import { PackageOpen } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState, PageContainer, PresetArtwork } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { getCollectionQuery } from "@/features/collections/queries";
import { listItemsQuery } from "@/features/items/queries";

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getCollectionQuery(id);

  if (result.status === "not_found" || result.status === "validation_error")
    notFound();

  if (result.status !== "success") {
    return (
      <PageContainer as="main">
        <p className="text-error" role="alert">
          Could not load this collection. Return to My Library and try again.
        </p>
      </PageContainer>
    );
  }

  const collection = result.data;
  const items = await listItemsQuery(id);

  return (
    <PageContainer as="main">
      <header className="flex flex-wrap items-center gap-4 py-3 sm:gap-6 sm:py-6">
        <PresetArtwork presetKey={collection.presetKey ?? "blank"} size="lg" />
        <div className="min-w-0 space-y-1">
          <h1 className="text-page-title-mobile sm:text-page-title break-words">
            {collection.name}
          </h1>
          {collection.description ? (
            <p className="text-foreground-muted break-words">
              {collection.description}
            </p>
          ) : null}
          <p className="text-foreground-muted text-sm">
            {collection.itemCount}{" "}
            {collection.itemCount === 1 ? "item" : "items"}
          </p>
        </div>
        <Button asChild className="ml-auto">
          <Link href={`/collections/${id}/items/new` as Route}>Add item</Link>
        </Button>
      </header>
      {items.status === "success" && items.data.length === 0 ? (
        <EmptyState
          className="mt-6"
          description="This collection is ready for the things you want to remember."
          icon={<PackageOpen aria-hidden="true" />}
          title="No items yet"
        />
      ) : items.status === "success" ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.data.map((item) => (
            <li
              className="rounded-card border-border bg-surface border p-4"
              key={item.id}
            >
              <p className="font-semibold break-words">{item.title}</p>
              {item.description ? (
                <p className="text-foreground-muted mt-1 line-clamp-2 text-sm">
                  {item.description}
                </p>
              ) : null}
              <Button asChild className="mt-3" size="sm" variant="outline">
                <Link href={`/collections/${id}/items/${item.id}` as Route}>
                  View {item.title}
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-error" role="alert">
          Could not load Items. Try again.
        </p>
      )}
    </PageContainer>
  );
}
