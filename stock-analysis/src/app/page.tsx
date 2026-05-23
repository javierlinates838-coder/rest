"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatLargeNumber, formatPercent } from "@/lib/utils";
import { PremiumSearch } from "@/components/premium-search";
import { MobileTrendingList } from "@/components/mobile-trending-list";
import { StockPicks } from "@/components/stock-picks";
import { StockLogo } from "@/components/stock-logo";
import { OnlyHereStrip } from "@/components/only-here-strip";
import { CommandStatusBar } from "@/components/command-status-bar";
import { ProSectionHeader } from "@/components/pro-section-header";
import { PulseFrame } from "@/components/pulse-frame";
import { HERO, TERMS } from "@/lib/brand";
import { HUB_QUICK_PICKS } from "@/lib/hub-symbols";
import { dedupeBySymbol, excludeSymbols } from "@/lib/dedupe-by-symbol";
import type { SectorPerformanceRow } from "@/lib/sectors";
import { normalizeMarketSectors } from "@/lib/sectors";
import { SectorHeatmap } from "@/components/sector-heatmap";

interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface TrendingStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sector: string;
}

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
}

interface MoverStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [trending, setTrending] = useState<TrendingStock[]>([]);
  const [sectors, setSectors] = useState<SectorPerformanceRow[]>([]);
  const [gainers, setGainers] = useState<MoverStock[]>([]);
  const [losers, setLosers] = useState<MoverStock[]>([]);
  const [dataSources, setDataSources] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [sectorsEstimated, setSectorsEstimated] = useState(false);
  const [sectorSource, setSectorSource] = useState<string | undefined>();
  const [meridianSymbols, setMeridianSymbols] = useState<string[]>([]);
  const handleMeridianSymbols = useCallback((symbols: string[]) => {
    setMeridianSymbols(symbols);
  }, []);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const searchRequestId = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchMarketData() {
      try {
        setMarketError(null);
        const [marketRes, sectorsRes] = await Promise.all([
          fetch("/api/market"),
          fetch("/api/sectors"),
        ]);
        const data = marketRes.ok ? await marketRes.json() : { error: "Market data unavailable" };
        const sectorPayload = sectorsRes.ok ? await sectorsRes.json() : null;
        if (cancelled) return;

        const sectorRows = sectorPayload?.sectors
          ? normalizeMarketSectors(sectorPayload.sectors)
          : marketRes.ok
            ? normalizeMarketSectors(data.sectors || [])
            : [];
        setSectors(sectorRows);
        setSectorsEstimated(
          Boolean(sectorPayload?.estimated ?? data.sectorsEstimated)
        );
        setSectorSource(sectorPayload?.source ?? data.sectorSource);

        if (!marketRes.ok) {
          setMarketError(data.error || "Market data unavailable");
        } else {
          setMarketError(null);
          setIndices(data.indices || []);
          setTrending(data.trending || []);
          setGainers(data.topGainers || []);
          setLosers(data.topLosers || []);
          setDataSources(data.dataSources || {});
        }
      } catch (e) {
        if (!cancelled) setMarketError("Could not load market data. Check your connection and try again.");
        console.error("Failed to fetch market data:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (value.length >= 1) {
      const reqId = ++searchRequestId.current;
      searchTimeout.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
          const data = await res.json();
          if (reqId !== searchRequestId.current) return;
          setSearchResults(dedupeBySymbol(data.results || []));
          setShowResults(true);
        } catch {
          if (reqId !== searchRequestId.current) return;
          setSearchResults([]);
        }
      }, 300);
    } else {
      searchRequestId.current += 1;
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowResults(false);
      router.push(`/stock/${searchQuery.trim().toUpperCase()}`);
    }
  };

  const trendingDisplay = useMemo(
    () => excludeSymbols(dedupeBySymbol(trending), meridianSymbols, HUB_QUICK_PICKS),
    [trending, meridianSymbols]
  );

  const gainersDisplay = useMemo(
    () =>
      excludeSymbols(
        dedupeBySymbol(gainers),
        meridianSymbols,
        HUB_QUICK_PICKS,
        trendingDisplay.map((s) => s.symbol)
      ),
    [gainers, meridianSymbols, trendingDisplay]
  );

  const losersDisplay = useMemo(
    () =>
      excludeSymbols(
        dedupeBySymbol(losers),
        meridianSymbols,
        HUB_QUICK_PICKS,
        trendingDisplay.map((s) => s.symbol),
        gainersDisplay.map((s) => s.symbol)
      ),
    [losers, meridianSymbols, trendingDisplay, gainersDisplay]
  );

  return (
    <div className="page-shell page-shell-wide">
      <CommandStatusBar
        loading={loading}
        indicesCount={indices.length}
        trendingCount={trendingDisplay.length || trending.length}
      />

      <PulseFrame className="command-hero command-hero-hub text-center animate-fadeIn relative z-[1] mb-0">
        <div className="pulse-frame-inner">
        <span className="hero-eyebrow">{HERO.eyebrow}</span>
        <h1 className="command-hero-title text-white mb-3 sm:mb-4 px-1 font-display">
          <span className="hero-title-line">
            {HERO.titleLead}{" "}
            <span className="gradient-text">{HERO.titleAccent}</span>
          </span>
          <span className="hero-title-line hero-title-line-tail">{HERO.titleTail}</span>
        </h1>
        <p className="hidden sm:block text-[15px] text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed px-2">
          {HERO.subtitleDesktop}
        </p>
        <p className="sm:hidden text-[14px] text-slate-500 mb-5 leading-relaxed px-1 font-mono">
          {HERO.subtitleMobile}
        </p>

        <div ref={searchRef} className="w-full max-w-2xl mx-auto relative z-[2]">
          <PremiumSearch
            searchQuery={searchQuery}
            searchResults={searchResults}
            showResults={showResults}
            onQueryChange={handleSearchChange}
            onSubmit={handleSearch}
            onCloseResults={() => setShowResults(false)}
            onOpenResults={() => searchQuery.length > 0 && searchResults.length > 0 && setShowResults(true)}
            quickPicks={[...HUB_QUICK_PICKS]}
          />
        </div>

        <div className="hidden sm:flex flex-wrap justify-center gap-2 mt-5">
          {HUB_QUICK_PICKS.map((symbol) => (
            <button
              key={symbol}
              onClick={() => router.push(`/stock/${symbol}`)}
              className="chip-press px-4 py-1.5 text-[12px] font-medium bg-slate-900/50 border border-slate-700/50 rounded-full text-slate-400 hover:text-teal-100 hover:border-teal-500/40 hover:bg-teal-500/10"
            >
              {symbol}
            </button>
          ))}
        </div>

        {Object.keys(dataSources).length > 0 && (
          <div className="hidden sm:flex justify-center flex-wrap gap-2 mt-6">
            {Object.entries(dataSources).map(([key, value]) => (
              <span key={key} className="data-source-tag">{value}</span>
            ))}
          </div>
        )}
        </div>
      </PulseFrame>

      {marketError && !loading && (
        <div className="glass-card rounded-xl px-4 py-3 mb-6 border border-amber-500/20 bg-amber-500/5 text-sm text-amber-200/90 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span>{marketError}</span>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              Promise.all([fetch("/api/market"), fetch("/api/sectors")])
                .then(async ([mRes, sRes]) => {
                  const data = await mRes.json();
                  const sectorPayload = sRes.ok ? await sRes.json() : null;
                  if (data.error) setMarketError(data.error);
                  else {
                    setMarketError(null);
                    setIndices(data.indices || []);
                    setTrending(data.trending || []);
                    setSectors(
                      sectorPayload?.sectors
                        ? normalizeMarketSectors(sectorPayload.sectors)
                        : normalizeMarketSectors(data.sectors || [])
                    );
                    setSectorsEstimated(
                      Boolean(sectorPayload?.estimated ?? data.sectorsEstimated)
                    );
                    setSectorSource(sectorPayload?.source ?? data.sectorSource);
                    setGainers(data.topGainers || []);
                    setLosers(data.topLosers || []);
                    setDataSources(data.dataSources || {});
                  }
                })
                .catch(() => setMarketError("Could not load market data."))
                .finally(() => setLoading(false));
            }}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-100 hover:bg-amber-500/30 shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <>
          <div className="indices-scroll mb-10">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 skeleton-shine min-h-[108px]">
                <div className="h-3 bg-zinc-800 rounded w-12 mb-3" />
                <div className="h-5 bg-zinc-800 rounded w-20 mb-2" />
                <div className="h-3 bg-zinc-800 rounded w-16" />
              </div>
            ))}
          </div>
          <div className="sector-board mb-10 skeleton-shine min-h-[320px]" aria-hidden />
        </>
      ) : (
        <>
          <StockPicks onSymbolsChange={handleMeridianSymbols} />

          <OnlyHereStrip />

          <ProSectionHeader
            title="Benchmark tape"
            subtitle={`${TERMS.liveTape} — indices streaming into Pulse Hub`}
            badge="LIVE"
          />
          <div className="indices-scroll mb-10">
            {indices.length === 0 ? (
              <p className="text-sm text-zinc-500 px-2 py-4">Benchmark tape unavailable — check API keys or retry above.</p>
            ) : null}
            {indices.map((index, i) => (
              <div
                key={index.symbol}
                role="button"
                tabIndex={0}
                className={`index-tile-pro interactive-card group animate-fadeInUp stagger-${i + 1} cursor-pointer`}
                onClick={() => router.push(`/stock/${index.symbol}`)}
                onKeyDown={(e) => e.key === "Enter" && router.push(`/stock/${index.symbol}`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="index-tile-symbol">{index.symbol}</div>
                  <div className={`w-1.5 h-1.5 rounded-full ${index.changePercent >= 0 ? "bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : "bg-red-500"}`} />
                </div>
                <div className="index-tile-price">{formatCurrency(index.price)}</div>
                <div className={`pro-metric-delta mt-1 ${index.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {formatPercent(index.changePercent)}
                </div>
              </div>
            ))}
          </div>

          <SectorHeatmap
            sectors={sectors}
            estimated={sectorsEstimated}
            source={sectorSource}
          />

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-10">
            <div className="xl:col-span-8">
              <ProSectionHeader
                title="Active tape"
                subtitle={`High-velocity names · open any row for ${TERMS.pulseScan}`}
                badge="TAPE"
              />
              <MobileTrendingList
                stocks={trendingDisplay}
                onSelect={(symbol) => router.push(`/stock/${symbol}`)}
              />
              <div className="hidden lg:block pro-table-wrap table-scroll">
                <table className="w-full min-w-[520px]">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="text-left text-[10px] text-zinc-500 font-semibold tracking-widest uppercase px-5 py-3">Symbol</th>
                      <th className="text-right text-[10px] text-zinc-500 font-semibold tracking-widest uppercase px-5 py-3">Price</th>
                      <th className="text-right text-[10px] text-zinc-500 font-semibold tracking-widest uppercase px-5 py-3">Change</th>
                      <th className="text-right text-[10px] text-zinc-500 font-semibold tracking-widest uppercase px-5 py-3 hidden sm:table-cell">Volume</th>
                      <th className="text-right text-[10px] text-zinc-500 font-semibold tracking-widest uppercase px-5 py-3 hidden md:table-cell">Mkt Cap</th>
                      <th className="text-center text-[10px] text-zinc-500 font-semibold tracking-widest uppercase px-5 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trendingDisplay.map((stock) => (
                      <tr
                        key={stock.symbol}
                        className="border-b border-white/[0.02] hover:bg-white/[0.02] cursor-pointer transition-colors duration-150"
                        onClick={() => router.push(`/stock/${stock.symbol}`)}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <StockLogo symbol={stock.symbol} size={32} />
                            <div>
                              <div className="text-[14px] font-semibold text-white tracking-tight">{stock.symbol}</div>
                              <div className="text-[11px] text-zinc-500 truncate max-w-[140px]">{stock.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-right px-5 py-3.5 text-[14px] font-medium text-white tracking-tight">{formatCurrency(stock.price)}</td>
                        <td className="text-right px-5 py-3.5">
                          <span className={`text-[13px] font-medium tracking-tight ${stock.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {formatPercent(stock.changePercent)}
                          </span>
                        </td>
                        <td className="text-right px-5 py-3.5 text-[13px] text-zinc-500 hidden sm:table-cell">{stock.volume ? `${(stock.volume / 1e6).toFixed(1)}M` : "—"}</td>
                        <td className="text-right px-5 py-3.5 text-[13px] text-zinc-500 hidden md:table-cell">{stock.marketCap ? formatLargeNumber(stock.marketCap) : "—"}</td>
                        <td className="text-center px-5 py-3.5">
                          <span className="px-3 py-1 text-[11px] font-semibold bg-teal-500/10 text-teal-400 rounded-full border border-teal-500/20 font-mono">
                            {TERMS.pulseScan}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="xl:col-span-4 space-y-6">
              {/* Top Gainers */}
              {gainersDisplay.length > 0 && (
                <div>
                  <h3 className="text-[15px] font-semibold text-emerald-400 mb-3 tracking-tight">Top Gainers</h3>
                  <div className="space-y-1.5">
                    {gainersDisplay.slice(0, 4).map((g) => (
                      <div key={g.symbol} className="glass-card rounded-xl px-4 py-2.5 flex justify-between items-center cursor-pointer" onClick={() => router.push(`/stock/${g.symbol}`)}>
                        <span className="text-[13px] font-semibold text-white">{g.symbol}</span>
                        <span className="text-[12px] font-semibold text-emerald-400">{formatPercent(g.changePercent)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Losers */}
              {losersDisplay.length > 0 && (
                <div>
                  <h3 className="text-[15px] font-semibold text-red-400 mb-3 tracking-tight">Top Losers</h3>
                  <div className="space-y-1.5">
                    {losersDisplay.slice(0, 4).map((l) => (
                      <div key={l.symbol} className="glass-card rounded-xl px-4 py-2.5 flex justify-between items-center cursor-pointer" onClick={() => router.push(`/stock/${l.symbol}`)}>
                        <span className="text-[13px] font-semibold text-white">{l.symbol}</span>
                        <span className="text-[12px] font-semibold text-red-400">{formatPercent(l.changePercent)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </>
      )}
    </div>
  );
}
