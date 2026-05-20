"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function StockError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Stock page error:", error);
  }, [error]);

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <div className="glass-card rounded-2xl p-10 max-w-lg mx-auto">
        <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">
          This page could not load
        </h2>
        <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
          Something went wrong while rendering the stock analysis. Try refreshing, or return to the dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-sm font-medium transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-200 text-sm font-medium transition-colors inline-block"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
