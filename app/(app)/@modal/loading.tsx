import { FlowModal } from "@/components/shared/flow-modal";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
export default function LoadingModal() {
  return (
    <FlowModal title="Loading…" returnTo="/library">
      <LoadingSkeleton label="Loading form" lines={6} />
    </FlowModal>
  );
}
