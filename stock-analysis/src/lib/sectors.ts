import { cleanDisplayLabel } from "@/lib/display-labels";

/** Canonical sector taxonomy — FMP, Yahoo, and screener filters all map here */
export const SECTOR_DEFINITIONS = [
  {
    id: "technology",
    label: "Technology",
    etf: "XLK",
    color: "#2dd4bf",
    aliases: ["technology", "information technology", "tech", "software"],
  },
  {
    id: "communication",
    label: "Communication",
    etf: "XLC",
    color: "#38bdf8",
    aliases: ["communication", "communication services", "telecommunications", "media", "telecom"],
  },
  {
    id: "financials",
    label: "Financials",
    etf: "XLF",
    color: "#a78bfa",
    aliases: ["financial", "financial services", "financials", "banks", "insurance"],
  },
  {
    id: "healthcare",
    label: "Healthcare",
    etf: "XLV",
    color: "#f472b6",
    aliases: ["healthcare", "health care", "biotechnology", "pharma", "pharmaceutical"],
  },
  {
    id: "consumer-discretionary",
    label: "Consumer Discretionary",
    etf: "XLY",
    color: "#fb923c",
    aliases: ["consumer cyclical", "consumer discretionary", "retail", "automotive", "auto"],
  },
  {
    id: "consumer-staples",
    label: "Consumer Staples",
    etf: "XLP",
    color: "#4ade80",
    aliases: ["consumer defensive", "consumer staples", "staples", "food"],
  },
  {
    id: "energy",
    label: "Energy",
    etf: "XLE",
    color: "#fbbf24",
    aliases: ["energy", "oil", "gas"],
  },
  {
    id: "industrials",
    label: "Industrials",
    etf: "XLI",
    color: "#94a3b8",
    aliases: ["industrials", "industrial", "aerospace", "defense"],
  },
  {
    id: "materials",
    label: "Materials",
    etf: "XLB",
    color: "#78716c",
    aliases: ["materials", "basic materials", "mining", "chemicals"],
  },
  {
    id: "real-estate",
    label: "Real Estate",
    etf: "XLRE",
    color: "#c084fc",
    aliases: ["real estate", "reit", "reits"],
  },
  {
    id: "utilities",
    label: "Utilities",
    etf: "XLU",
    color: "#60a5fa",
    aliases: ["utilities", "utility"],
  },
] as const;

export type SectorId = (typeof SECTOR_DEFINITIONS)[number]["id"];

export type SectorDefinition = (typeof SECTOR_DEFINITIONS)[number];

export const SCREENER_SECTOR_OPTIONS = ["all", ...SECTOR_DEFINITIONS.map((d) => d.label)] as const;

export type SectorPerformanceRow = {
  id: SectorId;
  label: string;
  etf: string;
  color: string;
  change: number;
  rank: number;
  barWidth: number;
  isLeader: boolean;
  isLaggard: boolean;
  source: "fmp" | "etf" | "mixed";
};

const ID_BY_NORMALIZED = new Map<string, SectorId>();

for (const def of SECTOR_DEFINITIONS) {
  ID_BY_NORMALIZED.set(def.id, def.id);
  ID_BY_NORMALIZED.set(def.label.toLowerCase(), def.id);
  for (const a of def.aliases) {
    ID_BY_NORMALIZED.set(a.toLowerCase(), def.id);
  }
}

export function getSectorById(id: SectorId): SectorDefinition | undefined {
  return SECTOR_DEFINITIONS.find((d) => d.id === id);
}

/** Resolve messy provider strings → canonical sector id */
export function resolveSectorId(raw: string): SectorId | null {
  const cleaned = cleanDisplayLabel(raw);
  if (!cleaned) return null;
  const lower = cleaned.toLowerCase();

  if (ID_BY_NORMALIZED.has(lower)) {
    return ID_BY_NORMALIZED.get(lower)!;
  }

  for (const def of SECTOR_DEFINITIONS) {
    if (def.aliases.some((a) => lower.includes(a) || a.includes(lower))) {
      return def.id;
    }
    if (lower.includes(def.label.toLowerCase())) {
      return def.id;
    }
  }

  return null;
}

export function normalizeSectorLabel(raw: string): string {
  const id = resolveSectorId(raw);
  if (!id) return cleanDisplayLabel(raw);
  return getSectorById(id)?.label ?? cleanDisplayLabel(raw);
}

/** Alpha Forge / screener sector filter */
export function sectorMatchesRow(filterLabel: string, rowSector: string): boolean {
  const filterId = resolveSectorId(filterLabel);
  const rowId = resolveSectorId(rowSector);
  if (filterId && rowId) return filterId === rowId;
  const row = rowSector.trim().toLowerCase();
  if (!row) return false;
  const def = SECTOR_DEFINITIONS.find((d) => d.label === filterLabel);
  if (!def) return row === filterLabel.toLowerCase();
  return def.aliases.some((a) => row === a || row.includes(a) || a.includes(row));
}

/** FMP snapshot keys like "Technology" or "Basic Materials" */
export function matchFmpSectorKey(fmpSector: string): SectorId | null {
  const key = fmpSector.replace(/\bsector\b/gi, "").trim();
  return resolveSectorId(key);
}

/** Accept full board rows or legacy `{ name, change }` from cached market payloads */
export function normalizeMarketSectors(raw: unknown): SectorPerformanceRow[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];

  const first = raw[0] as Record<string, unknown>;
  if (first && typeof first.id === "string" && typeof first.label === "string") {
    return rankSectorRows(
      raw.map((row) => {
        const r = row as SectorPerformanceRow;
        return {
          id: r.id,
          label: r.label,
          etf: r.etf,
          color: r.color,
          change: Number(r.change) || 0,
          source: r.source ?? "fmp",
        };
      })
    );
  }

  const legacy = raw as { name?: string; change?: number }[];
  const rows = SECTOR_DEFINITIONS.map((def) => {
    const match = legacy.find((l) => {
      const id = l.name ? resolveSectorId(l.name) : null;
      return id === def.id;
    });
    return {
      id: def.id,
      label: def.label,
      etf: def.etf,
      color: def.color,
      change: Number(match?.change) || 0,
      source: "etf" as const,
    };
  });
  return rankSectorRows(rows);
}

export function sectorColor(label: string): string {
  const id = resolveSectorId(label);
  return (id && getSectorById(id)?.color) || "#64748b";
}

export function rankSectorRows(
  rows: Omit<SectorPerformanceRow, "rank" | "barWidth" | "isLeader" | "isLaggard">[]
): SectorPerformanceRow[] {
  const sorted = [...rows].sort((a, b) => b.change - a.change);
  const maxAbs = Math.max(...sorted.map((s) => Math.abs(s.change)), 0.25);

  return sorted.map((row, i) => {
    const barWidth = Math.round((Math.abs(row.change) / maxAbs) * 100);
    return {
      ...row,
      rank: i + 1,
      barWidth: Math.max(8, Math.min(100, barWidth)),
      isLeader: i === 0,
      isLaggard: i === sorted.length - 1 && sorted.length > 1,
    };
  });
}
