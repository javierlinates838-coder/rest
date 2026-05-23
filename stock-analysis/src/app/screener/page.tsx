import { Suspense } from "react";
import ScreenerPageClient from "./screener-client";

export default function ScreenerRoutePage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell page-shell-wide p-8 text-sm text-zinc-500">
          Loading Alpha Forge…
        </div>
      }
    >
      <ScreenerPageClient />
    </Suspense>
  );
}
