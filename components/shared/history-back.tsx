"use client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export function HistoryBack() {
  return (
    <Button asChild variant="ghost">
      <Link
        href="/library"
        onClick={(event) => {
          if (window.history.length > 1) {
            event.preventDefault();
            window.history.back();
          }
        }}
      >
        <ArrowLeft aria-hidden="true" />
        Back
      </Link>
    </Button>
  );
}
