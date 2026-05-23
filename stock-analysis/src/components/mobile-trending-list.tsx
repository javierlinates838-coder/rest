"use client";

import { StockLogo } from "@/components/stock-logo";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface TrendingStock {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
}

export function MobileTrendingList({
  stocks,
  onSelect,
}: {
  stocks: TrendingStock[];
  onSelect: (symbol: string) => void;
}) {
  return (
    <div className="lg:hidden space-y-2">
      {stocks.map((stock, i) => (
        <button
          key={stock.symbol}
          type="button"
          onClick={() => onSelect(stock.symbol)}
          className={`mobile-stock-card w-full text-left flex items-center gap-3 animate-fadeInUp stagger-${Math.min(i + 1, 8)}`}
        >
          <StockLogo symbol={stock.symbol} size={40} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-bold text-white tracking-tight">{stock.symbol}</span>
              <span
                className={`text-[12px] font-semibold tabular-nums ${
                  stock.changePercent >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {formatPercent(stock.changePercent)}
              </span>
            </div>
            <p className="text-[12px] text-zinc-500 truncate mt-0.5">{stock.name}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[15px] font-semibold text-white tabular-nums">{formatCurrency(stock.price)}</p>
            <p className="text-[10px] text-zinc-500 font-medium mt-0.5">Open</p>
          </div>
        </button>
      ))}
    </div>
  );
}
