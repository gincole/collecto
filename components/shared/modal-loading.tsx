import type { Route } from "next";
import { FlowModal } from "./flow-modal";
import { LoadingSkeleton } from "./loading-skeleton";

export function ModalLoading<T extends string>({
  title,
  returnTo,
}: {
  title: string;
  returnTo: Route<T>;
}) {
  return (
    <FlowModal page title={title} returnTo={returnTo}>
      <LoadingSkeleton label={`Loading ${title}`} lines={6} />
    </FlowModal>
  );
}
