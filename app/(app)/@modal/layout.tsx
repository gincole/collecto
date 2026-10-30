import type { ReactNode } from "react";
import { InterceptedFlows } from "@/components/shared/flow-modal";
export default function ModalLayout({ children }: { children: ReactNode }) {
  return <InterceptedFlows>{children}</InterceptedFlows>;
}
