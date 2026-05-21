import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-shell max-w-lg mx-auto py-24 text-center animate-softPop">
      <div className="glass-card rounded-2xl p-10 glow-border hero-glow-ring">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-indigo-400 mb-3">404</p>
        <h1 className="text-2xl font-semibold text-white tracking-tight mb-3">Page not found</h1>
        <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
          That URL does not exist. Search for a ticker on the dashboard or open a symbol directly.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="btn-primary pressable px-6 py-2.5 rounded-lg text-white text-sm"
          >
            Dashboard
          </Link>
          <Link
            href="/stock/AAPL"
            className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-200 text-sm font-medium transition-colors"
          >
            Analyze AAPL
          </Link>
        </div>
      </div>
    </div>
  );
}
