export function StockPageSkeleton() {
  return (
    <div className="page-shell page-shell-wide">
      <div className="space-y-4 sm:space-y-6">
        <div className="glass-card rounded-2xl p-4 sm:p-6">
          <div className="flex gap-3 items-start">
            <div className="h-11 w-11 rounded-xl bg-zinc-800/60 skeleton-shine shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-7 w-24 bg-zinc-800/60 rounded-lg skeleton-shine" />
              <div className="h-4 w-40 bg-zinc-800/50 rounded skeleton-shine" />
            </div>
          </div>
          <div className="mt-4 h-12 w-36 bg-zinc-800/60 rounded-lg skeleton-shine" />
        </div>
        <div className="h-48 rounded-2xl bg-zinc-800/40 skeleton-shine" />
        <div className="flex gap-2 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-11 w-20 shrink-0 bg-zinc-800/40 rounded-lg skeleton-shine" />
          ))}
        </div>
        <div className="h-[280px] bg-zinc-800/40 rounded-2xl skeleton-shine" />
      </div>
    </div>
  );
}

export function AnalysisBlockSkeleton() {
  return (
    <div className="border-t border-white/[0.06] p-4 space-y-3" aria-hidden>
      <div className="h-4 w-32 bg-zinc-800/50 rounded skeleton-shine" />
      <div className="h-24 rounded-xl bg-zinc-800/40 skeleton-shine" />
      <div className="grid grid-cols-2 gap-2">
        <div className="h-16 rounded-lg bg-zinc-800/35 skeleton-shine" />
        <div className="h-16 rounded-lg bg-zinc-800/35 skeleton-shine" />
      </div>
    </div>
  );
}
