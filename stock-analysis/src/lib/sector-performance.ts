import {
  type SectorId,
  SECTOR_DEFINITIONS,
  matchFmpSectorKey,
  rankSectorRows,
  type SectorPerformanceRow,
} from "@/lib/sectors";
import { fmpFetchQuoteChangeBatch, fmpFetchSectorPerformance } from "@/services/fmp-api";
import { fetchStockQuote } from "@/services/stock-data";

type RawSectorChange = { id: SectorId; change: number; source: "fmp" | "etf" };

async function fetchEtfSectorChanges(missingIds: SectorId[]): Promise<RawSectorChange[]> {
  const defs = SECTOR_DEFINITIONS.filter((d) => missingIds.includes(d.id));
  const etfSymbols = defs.map((d) => d.etf);
  const batch = await fmpFetchQuoteChangeBatch(etfSymbols);

  return Promise.all(
    defs.map(async (def) => {
      const fromBatch = batch.get(def.etf.toUpperCase());
      if (fromBatch != null && Number.isFinite(fromBatch)) {
        return { id: def.id, change: fromBatch, source: "etf" as const };
      }
      try {
        const q = await fetchStockQuote(def.etf);
        return { id: def.id, change: q.changePercent, source: "etf" as const };
      } catch {
        return { id: def.id, change: 0, source: "etf" as const };
      }
    })
  );
}

/**
 * Full sector board: FMP sector snapshot when available, ETF proxies fill gaps.
 */
export async function buildSectorPerformanceBoard(): Promise<{
  sectors: SectorPerformanceRow[];
  estimated: boolean;
  source: "fmp" | "etf" | "mixed";
}> {
  const fmpRows = await fmpFetchSectorPerformance().catch(() => []);
  const byId = new Map<SectorId, RawSectorChange>();

  for (const row of fmpRows) {
    const id = matchFmpSectorKey(row.sector);
    if (!id) continue;
    const change = parseFloat(row.changesPercentage);
    if (!Number.isFinite(change)) continue;
    const existing = byId.get(id);
    if (!existing || Math.abs(change) > Math.abs(existing.change)) {
      byId.set(id, { id, change, source: "fmp" });
    }
  }

  const missing = SECTOR_DEFINITIONS.map((d) => d.id).filter((id) => !byId.has(id));
  let usedEtf = false;

  if (byId.size === 0) {
    const etfAll = await fetchEtfSectorChanges(SECTOR_DEFINITIONS.map((d) => d.id));
    for (const e of etfAll) byId.set(e.id, e);
    usedEtf = true;
  } else if (missing.length > 0) {
    const etfFill = await fetchEtfSectorChanges(missing);
    for (const e of etfFill) {
      byId.set(e.id, e);
      usedEtf = true;
    }
  }

  const rows = SECTOR_DEFINITIONS.map((def) => {
    const raw = byId.get(def.id);
    const source: SectorPerformanceRow["source"] =
      raw?.source === "fmp" && usedEtf ? "mixed" : raw?.source === "etf" ? "etf" : "fmp";
    return {
      id: def.id,
      label: def.label,
      etf: def.etf,
      color: def.color,
      change: raw?.change ?? 0,
      source,
    };
  });

  const estimated = fmpRows.length === 0;
  const boardSource: "fmp" | "etf" | "mixed" = estimated ? "etf" : usedEtf ? "mixed" : "fmp";

  return {
    sectors: rankSectorRows(rows),
    estimated,
    source: boardSource,
  };
}
