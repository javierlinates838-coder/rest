"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface SearchResultItem {
  symbol: string;
  name: string;
  exchange: string;
}

interface PremiumSearchProps {
  searchQuery: string;
  searchResults: SearchResultItem[];
  showResults: boolean;
  onQueryChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCloseResults: () => void;
  onOpenResults: () => void;
  quickPicks: string[];
}

export function PremiumSearch({
  searchQuery,
  searchResults,
  showResults,
  onQueryChange,
  onSubmit,
  onCloseResults,
  onOpenResults,
  quickPicks,
}: PremiumSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const goToSymbol = (symbol: string) => {
    onCloseResults();
    router.push(`/stock/${symbol.toUpperCase()}`);
  };

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 639px)").matches;
    if (mobile && showResults && searchResults.length > 0) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [showResults, searchResults.length]);

  return (
    <>
      {/* ——— Desktop (unchanged feel) ——— */}
      <div className="hidden sm:block max-w-2xl mx-auto relative">
        <form onSubmit={onSubmit}>
          <div className="relative">
            <svg
              className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={onOpenResults}
              placeholder="Search any stock symbol or company name..."
              className="w-full pl-14 pr-32 py-4 bg-zinc-900/60 border border-zinc-800/60 rounded-2xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-all text-[15px] font-light tracking-tight"
            />
            <button
              type="submit"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white text-[13px] font-semibold tracking-wide hover:from-indigo-400 hover:to-purple-400 transition-all shadow-lg shadow-indigo-500/20"
            >
              Analyze
            </button>
          </div>
        </form>
        {showResults && searchResults.length > 0 && (
          <DesktopResults results={searchResults} onSelect={goToSymbol} />
        )}
      </div>

      {/* ——— Mobile premium search ——— */}
      <div className="sm:hidden w-full">
        <form onSubmit={onSubmit} className="search-hero-mobile">
          <div className="search-hero-glow" aria-hidden />
          <div className="relative z-[1] p-4">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-indigo-400/90 mb-3 text-center">
              Deep analysis · Live data
            </p>
            <div className="flex items-center gap-2 rounded-2xl bg-zinc-950/80 border border-white/[0.08] px-3 py-1 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/15 transition-all">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                ref={inputRef}
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={searchQuery}
                onChange={(e) => onQueryChange(e.target.value)}
                onFocus={onOpenResults}
                placeholder="Ticker or company"
                className="flex-1 min-w-0 bg-transparent py-3.5 text-[17px] font-medium text-white placeholder:text-zinc-600 focus:outline-none"
              />
              {searchQuery.length > 0 && (
                <button
                  type="button"
                  onClick={() => onQueryChange("")}
                  className="shrink-0 h-9 w-9 flex items-center justify-center rounded-full bg-zinc-800/80 text-zinc-400"
                  aria-label="Clear"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="submit"
              className="mt-3 w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-semibold text-white bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-transform"
            >
              <span>Analyze stock</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </form>

        {/* Quick picks — snap scroll */}
        <div className="mt-4">
          <p className="text-[10px] font-semibold tracking-wider uppercase text-zinc-600 mb-2 px-1">Popular</p>
          <div className="quick-picks-scroll flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {quickPicks.map((symbol) => (
              <button
                key={symbol}
                type="button"
                onClick={() => goToSymbol(symbol)}
                className="quick-pick-chip shrink-0"
              >
                {symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile results sheet */}
        {showResults && searchResults.length > 0 && (
          <>
            <button
              type="button"
              className="search-sheet-backdrop"
              aria-label="Close search"
              onClick={onCloseResults}
            />
            <div className="search-sheet" role="listbox">
              <div className="search-sheet-handle" />
              <p className="text-[11px] font-semibold tracking-wider uppercase text-zinc-500 mb-3 px-1">
                {searchResults.length} matches
              </p>
              <ul className="space-y-1 max-h-[50vh] overflow-y-auto">
                {searchResults.map((r) => (
                  <li key={r.symbol}>
                    <button
                      type="button"
                      onClick={() => goToSymbol(r.symbol)}
                      className="search-result-row w-full text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="search-result-symbol">{r.symbol}</span>
                        <span className="search-result-name truncate">{r.name}</span>
                      </div>
                      <span className="search-result-exchange shrink-0">{r.exchange}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function DesktopResults({
  results,
  onSelect,
}: {
  results: SearchResultItem[];
  onSelect: (symbol: string) => void;
}) {
  return (
    <div className="absolute top-full mt-2 w-full glass-card rounded-xl overflow-hidden z-50 border border-zinc-800/50 animate-fadeIn">
      {results.map((r) => (
        <button
          key={r.symbol}
          type="button"
          onClick={() => onSelect(r.symbol)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-zinc-800/50 transition-colors text-left"
        >
          <div className="min-w-0">
            <span className="text-[14px] font-semibold text-white">{r.symbol}</span>
            <span className="text-[12px] text-zinc-500 ml-3">{r.name}</span>
          </div>
          <span className="text-[11px] text-zinc-600 shrink-0">{r.exchange}</span>
        </button>
      ))}
    </div>
  );
}
