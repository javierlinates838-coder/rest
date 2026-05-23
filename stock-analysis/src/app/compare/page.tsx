import { Suspense } from "react";
import { CompareClient } from "@/components/compare-client";

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell page-shell-wide py-16 text-center text-zinc-500 text-sm">
          Loading Twin Lens…
        </div>
      }
    >
      <CompareClient />
    </Suspense>
  );
}
